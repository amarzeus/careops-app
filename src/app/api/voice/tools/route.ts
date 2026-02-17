import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tool handlers map
const handlers = {
  check_availability: async (params: any) => {
    try {
      const { serviceId, date } = params;
      // Mock logic: check if service exists and return some slots
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) return { error: "Service not found" };

      // In a real app, we'd check existing bookings. For proto, return standard slots.
      return {
        available: true,
        slots: ["09:00", "10:00", "11:00", "14:00", "15:00"],
        date,
        service: service.name
      };
    } catch (e) {
      console.error(e);
      return { error: "Failed to check availability" };
    }
  },

  create_booking: async (params: any) => {
    try {
      const { serviceId, contactName, contactPhone, date, time, notes } = params;

      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) return { error: "Service not found" };

      let contact = await prisma.contact.findFirst({
        where: { phone: contactPhone, workspaceId: service.workspaceId }
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            name: contactName,
            phone: contactPhone,
            workspaceId: service.workspaceId,
            source: "voice_ai"
          }
        });
      }

      // Create DateTime objects
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hours, minutes);
      const endDate = new Date(startDate.getTime() + service.duration * 60000);

      const booking = await prisma.booking.create({
        data: {
          date: startDate,
          endTime: endDate,
          status: "CONFIRMED",
          notes: notes || "Booked via Voice AI",
          serviceId: service.id,
          contactId: contact.id,
          workspaceId: service.workspaceId
        }
      });

      return {
        success: true,
        bookingId: booking.id,
        message: `Booking confirmed for ${service.name} on ${date} at ${time}.`
      };
    } catch (e) {
      console.error("Booking error:", e);
      return { error: "Failed to create booking" };
    }
  },

  get_booking_status: async (params: any) => {
    // Mock implementation
    return { status: "confirmed", details: "Your booking is set for tomorrow at 10 AM." };
  },

  transfer_to_staff: async (params: any) => {
    // In Vapi, to transfer, we might need to return a specific response or use a separate API call.
    // For now, we'll return a message that the agent interprets as "I need to hang up".
    return { transfer: true, destination: params.staffName };
  },

  get_services: async (params: any) => {
    // We need workspace scope. Simple hack: passed as param or we query all?
    // Ideally, the system prompt has the services list embedded.
    // But if dynamic:
    return { services: ["consultation", "haircut", "therapy"] };
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[VAPI:Tool] Generic Request Body Received:", body);

    const toolCalls = body.message?.toolCalls;
    if (!toolCalls || toolCalls.length === 0) {
      // Handshake or simple status
      return NextResponse.json({ results: [] });
    }

    const results = [];

    for (const toolCall of toolCalls) {
      const { id, function: func } = toolCall;
      const { name, arguments: args } = func;

      let parsedArgs = args;
      if (typeof args === 'string') {
        try {
          parsedArgs = JSON.parse(args);
        } catch (e) {
          console.error("Failed to parse tool args", args);
        }
      }

      console.log(`[VAPI:Tool] Executing ${name}`, parsedArgs);

      const handler = handlers[name as keyof typeof handlers];
      let result;

      if (handler) {
        result = await handler(parsedArgs);
      } else {
        result = { error: `Tool ${name} not found` };
      }

      results.push({
        toolCallId: id,
        result: typeof result === 'string' ? result : JSON.stringify(result)
      });
    }

    // Return format expected by Vapi
    return NextResponse.json({ results });

  } catch (error) {
    console.error("[VAPI:Tool] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
