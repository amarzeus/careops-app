import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import { isAfterHours, normalizeVoicePhoneNumber } from "@/lib/voice-compliance";
import { checkUsageLimit, trackUsage } from "@/lib/razorpay-subscriptions";
import { verifyWebhookSignature } from "@/lib/webhook-security";

type ToolParams = Record<string, unknown> & { _workspaceId?: string };
type ToolResult = Record<string, unknown>;
type ToolHandler = (params: ToolParams, workspaceId: string) => Promise<ToolResult>;

/**
 *
 */
function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 *
 */
function parseDateAndTime(dateValue: unknown, timeValue: unknown): Date | null {
  const date = asString(dateValue);
  const time = asString(timeValue);
  if (!date || !time) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  if ([year, month, day, hours, minutes].some((part: number) => Number.isNaN(part))) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes);
}

/**
 *
 */
function isBookingOpenStatus(status: string): boolean {
  return status === "PENDING" || status === "CONFIRMED";
}

const handlers: Record<string, ToolHandler> = {
  check_availability: async (params, workspaceId) => {
    const serviceId = asString(params.serviceId);
    const date = asString(params.date);

    if (!serviceId || !date) {
      return { error: "serviceId and date are required" };
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
    });
    if (!service) {
      return { error: "Service not found" };
    }

    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);

    const existingBookings = await prisma.booking.findMany({
      where: {
        serviceId,
        date: { gte: start, lte: end },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { date: true },
    });

    const bookedSlots = new Set(
      existingBookings.map((booking: { date: Date }) =>
        booking.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      )
    );

    const allSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
    const slots = allSlots.filter((slot: string) => !bookedSlots.has(slot));

    return {
      available: slots.length > 0,
      slots,
      date,
      service: service.name,
      durationMinutes: service.duration,
    };
  },

  create_booking: async (params, workspaceId) => {
    const serviceId = asString(params.serviceId);
    const contactName = asString(params.contactName);
    const contactPhoneRaw = asString(params.contactPhone);
    const contactEmail = asString(params.contactEmail);
    const date = asString(params.date);
    const time = asString(params.time);
    const notes = asString(params.notes);

    if (!serviceId || !contactName || !contactPhoneRaw || !date || !time) {
      return { error: "serviceId, contactName, contactPhone, date, and time are required" };
    }

    const bookingLimit = await checkUsageLimit(workspaceId, "bookings");
    if (!bookingLimit.allowed) {
      return {
        error: `Booking limit reached. Used: ${bookingLimit.used}/${bookingLimit.limit}. Please upgrade your plan.`,
        action: "upgrade_required",
      };
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return { error: "Service not found" };
    }

    const contactPhone = normalizeVoicePhoneNumber(contactPhoneRaw);

    let contact = await prisma.contact.findFirst({
      where: {
        workspaceId: service.workspaceId,
        OR: [{ phone: contactPhoneRaw }, { phone: contactPhone }],
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
          workspaceId: service.workspaceId,
          source: "voice_ai",
        },
      });
      await trackUsage(workspaceId, "contacts", 1);
    }

    const startDate = parseDateAndTime(date, time);
    if (!startDate) {
      return { error: "Invalid date/time format" };
    }

    const endDate = new Date(startDate.getTime() + service.duration * 60000);

    const booking = await prisma.booking.create({
      data: {
        date: startDate,
        endTime: endDate,
        status: "CONFIRMED",
        notes: notes || "Booked via CareOps AI",
        serviceId: service.id,
        contactId: contact.id,
        workspaceId: service.workspaceId,
      },
    });

    await trackUsage(workspaceId, "bookings", 1);

    return {
      success: true,
      bookingId: booking.id,
      message: `Booking confirmed for ${service.name} on ${date} at ${time}.`,
    };
  },

  get_booking_status: async (params, workspaceId) => {
    const bookingId = asString(params.bookingId);
    const customerPhoneRaw = asString(params.customerPhone);

    let booking = null;

    if (bookingId) {
      booking = await prisma.booking.findFirst({
        where: { id: bookingId, workspaceId },
        include: { service: true, contact: true },
      });
    } else if (customerPhoneRaw) {
      const normalizedPhone = normalizeVoicePhoneNumber(customerPhoneRaw);
      booking = await prisma.booking.findFirst({
        where: {
          workspaceId,
          contact: {
            OR: [{ phone: customerPhoneRaw }, { phone: normalizedPhone }],
          },
          status: { in: ["PENDING", "CONFIRMED"] },
          date: { gte: new Date() },
        },
        include: { service: true, contact: true },
        orderBy: { date: "asc" },
      });
    }

    if (!booking) {
      return { found: false, message: "No upcoming booking found." };
    }

    return {
      found: true,
      bookingId: booking.id,
      status: booking.status,
      service: booking.service.name,
      customerName: booking.contact.name,
      dateTime: booking.date.toISOString(),
      message: `You have a ${booking.service.name} booking on ${booking.date.toLocaleString()}.`,
    };
  },

  reschedule_booking: async (params, workspaceId) => {
    const bookingId = asString(params.bookingId);
    const date = asString(params.date);
    const time = asString(params.time);

    if (!bookingId || !date || !time) {
      return { error: "bookingId, date, and time are required" };
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, workspaceId },
      include: { service: true, contact: true },
    });

    if (!booking) {
      return { error: "Booking not found" };
    }

    if (!isBookingOpenStatus(booking.status)) {
      return { error: `Booking cannot be rescheduled from status ${booking.status}` };
    }

    const startDate = parseDateAndTime(date, time);
    if (!startDate) {
      return { error: "Invalid date/time format" };
    }

    const endDate = new Date(startDate.getTime() + booking.service.duration * 60000);

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        date: startDate,
        endTime: endDate,
        status: "CONFIRMED",
        notes: booking.notes
          ? `${booking.notes}\nRescheduled by CareOps AI on ${new Date().toISOString()}`
          : `Rescheduled by CareOps AI on ${new Date().toISOString()}`,
      },
      include: { service: true, contact: true },
    });

    if (updated.contact.phone) {
      await sendSMS({
        to: updated.contact.phone,
        body: `Your ${updated.service.name} appointment has been rescheduled to ${updated.date.toLocaleString()}.`,
        workspaceId: updated.workspaceId,
      });
    }

    return {
      success: true,
      bookingId: updated.id,
      message: `Booking moved to ${updated.date.toLocaleString()}.`,
    };
  },

  transfer_to_staff: async (params, _workspaceId) => {
    const staffName = asString(params.staffName) || "on-call staff";
    const reason = asString(params.reason) || "Customer requested escalation";

    return {
      transfer: true,
      destination: staffName,
      reason,
      message: `Transferring to ${staffName}.`,
    };
  },

  get_services: async (params, workspaceId) => {
    const services = await prisma.service.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        duration: true,
        price: true,
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    return { services };
  },

  get_business_hours: async (params, workspaceId) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { timezone: true },
    });

    const services = await prisma.service.findMany({
      where: { workspaceId, isActive: true },
      select: { startTime: true, endTime: true },
      take: 20,
    });

    const starts = services
      .map((service: { startTime: string }) => service.startTime)
      .filter(Boolean)
      .sort();
    const ends = services
      .map((service: { endTime: string }) => service.endTime)
      .filter(Boolean)
      .sort();

    const openTime = starts[0] || "09:00";
    const closeTime = ends[ends.length - 1] || "17:00";

    return {
      businessHours: `Monday to Friday, ${openTime} to ${closeTime}`,
      timezone: workspace?.timezone || "UTC",
      afterHours: isAfterHours(workspace?.timezone),
    };
  },
};

/**
 *
 */
export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-vapi-signature");
    const secret = process.env.VAPI_WEBHOOK_SECRET;
    const rawBody = await req.text();

    if (secret) {
      if (!signature) {
        return NextResponse.json({ error: "Missing tool signature" }, { status: 401 });
      }

      const normalizedSignature = signature.replace(/^sha256=/i, "").trim();
      const isValid = verifyWebhookSignature(rawBody, normalizedSignature, secret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid tool signature" }, { status: 401 });
      }
    }

    let body;
    try {
      body = JSON.parse(rawBody) as {
        message?: {
          toolCalls?: Array<{
            id: string;
            function: {
              name: string;
              arguments?: unknown;
            };
          }>;
        };
      };
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // We expect X-Workspace-Id to be passed in headers, but if VAPI calls this,
    // it passes custom headers as configured in the assistant.
    const workspaceId = req.headers.get("X-Workspace-Id");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspace context" }, { status: 400 });
    }

    const entitlement = await checkUsageLimit(workspaceId, "voice_minutes");
    if (!entitlement.allowed && entitlement.limit !== -1) {
      return NextResponse.json(
        {
          error: `Voice minutes limit exceeded. Used: ${entitlement.used}/${entitlement.limit}. Please upgrade.`,
          action: "upgrade_required",
        },
        { status: 402 }
      );
    }

    const toolCalls = body.message?.toolCalls || [];
    if (toolCalls.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results: Array<{ toolCallId: string; result: string }> = [];

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const rawArgs = toolCall.function.arguments;

      const parsedArgs: ToolParams =
        typeof rawArgs === "string"
          ? (() => {
            try {
              return JSON.parse(rawArgs) as ToolParams;
            } catch {
              return {};
            }
          })()
          : (rawArgs as ToolParams) || {};

      const handler = handlers[toolName];
      const result = handler
        ? await handler(parsedArgs, workspaceId)
        : { error: `Tool ${toolName} not found` };

      results.push({
        toolCallId: toolCall.id,
        result: JSON.stringify(result),
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[VAPI:Tool] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
