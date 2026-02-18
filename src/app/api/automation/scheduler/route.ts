import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerAutomation } from "@/lib/automation";
import { startOfDay, endOfDay, addDays } from "date-fns";

/**
 * BEFORE_BOOKING Scheduler
 * 
 * Called via cron job or manually to send reminders for bookings
 * happening within the next 24 hours.
 * 
 * Should be called periodically (e.g., every hour via cron).
 * Verifiable via: GET /api/automation/scheduler
 * @param req
 */
export async function GET(req: Request) {
  try {
    // secure with CRON_SECRET
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const tomorrow = addDays(now, 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    // Find all bookings happening tomorrow that haven't been reminded
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        date: { gte: tomorrowStart, lte: tomorrowEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        contact: true,
        service: true,
        workspace: true,
      },
    });

    let triggeredCount = 0;

    for (const booking of upcomingBookings) {
      // Check if a BEFORE_BOOKING rule exists and is active for this workspace
      const rules = await prisma.automationRule.findMany({
        where: {
          workspaceId: booking.workspaceId,
          trigger: "BEFORE_BOOKING",
          isActive: true,
        },
      });

      if (rules.length === 0) continue;

      // Check if we already sent a reminder (look for recent automation alert)
      const existingReminder = await prisma.alert.findFirst({
        where: {
          workspaceId: booking.workspaceId,
          type: "automation",
          title: "Booking Reminder Sent",
          message: { contains: booking.contact.name },
          createdAt: { gte: startOfDay(now) },
        },
      });

      if (existingReminder) continue; // Already reminded today

      await triggerAutomation(booking.workspaceId, "BEFORE_BOOKING", {
        booking: { id: booking.id, date: booking.date },
        contact: {
          id: booking.contact.id,
          name: booking.contact.name,
          email: booking.contact.email,
          phone: booking.contact.phone,
        },
        service: booking.service
          ? { id: booking.service.id, name: booking.service.name, location: booking.service.location }
          : undefined,
      });

      triggeredCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${upcomingBookings.length} upcoming bookings, triggered ${triggeredCount} reminders`,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduler error";
    console.error("BEFORE_BOOKING scheduler error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
