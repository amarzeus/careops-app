import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, addMinutes, isBefore, isAfter } from "date-fns";
import { format } from "date-fns-tz";
import { toUTC } from "@/lib/date-utils";

/**
 *
 * @param req
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!serviceId || !dateStr) {
        return NextResponse.json({ error: "Missing serviceId or date" }, { status: 400 });
    }

    try {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: { workspace: true } // Need timezone if possible, but let's stick to simple logic first
        });

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        // Get workspace timezone
        const timezone = service.workspace?.timezone || "UTC";

        // Parse date as local date in the workspace's timezone
        const queryDate = parseISO(dateStr);

        // Create start and end of day in the workspace's timezone, then convert to UTC
        const dayStartLocal = startOfDay(queryDate);
        const dayEndLocal = endOfDay(queryDate);

        const dayStart = toUTC(dayStartLocal, timezone);
        const dayEnd = toUTC(dayEndLocal, timezone);

        // Get existing bookings for this workspace in the UTC time range
        const existingBookings = await prisma.booking.findMany({
            where: {
                workspaceId: service.workspaceId,
                date: {
                    gte: dayStart,
                    lte: dayEnd
                },
                status: { not: "CANCELLED" }
            }
        });

        // Generate slots
        // Service available days: "1,2,3,4,5" (Mon-Fri)
        // d.getDay() returns 0 (Sun) - 6 (Sat)
        // date-fns getDay returns 0-6
        const dayOfWeek = queryDate.getDay();
        const availableDays = service.availableDays.split(",").map(Number);

        if (!availableDays.includes(dayOfWeek)) {
            return NextResponse.json({ slots: [] }); // Closed today
        }

        // Business Hours from Service (in workspace's timezone)
        const [startHour, startMin] = service.startTime.split(":").map(Number);
        const [endHour, endMin] = service.endTime.split(":").map(Number);

        // Create start/end Date objects for this specific day in workspace timezone
        let currentSlotLocal = new Date(queryDate);
        currentSlotLocal.setHours(startHour, startMin, 0, 0);

        const closeTimeLocal = new Date(queryDate);
        closeTimeLocal.setHours(endHour, endMin, 0, 0);

        const duration = service.duration;
        const slots = [];

        while (isBefore(currentSlotLocal, closeTimeLocal)) {
            const slotEndLocal = addMinutes(currentSlotLocal, duration);

            if (isAfter(slotEndLocal, closeTimeLocal)) break; // Don't go past closing

            // Convert local slot times to UTC for comparison
            const currentSlotUTC = toUTC(currentSlotLocal, timezone);
            const slotEndUTC = toUTC(slotEndLocal, timezone);

            // Check overlap with existing bookings (all in UTC)
            const isOverlap = existingBookings.some(booking => {
                const bStart = new Date(booking.date);
                const bEnd = new Date(booking.endTime);

                // Overlap condition: (StartA < EndB) and (EndA > StartB)
                return isBefore(currentSlotUTC, bEnd) && isAfter(slotEndUTC, bStart);
            });

            if (!isOverlap) {
                slots.push(format(currentSlotLocal, "HH:mm"));
            }

            // Move to next slot
            currentSlotLocal = addMinutes(currentSlotLocal, duration);
        }

        return NextResponse.json({ slots });
    } catch (error) {
        console.error("Availability Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
