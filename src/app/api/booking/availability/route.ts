import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, format, addMinutes, isBefore, isAfter } from "date-fns";

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

        // Parse date
        // Note: We'll interpret dateStr as local date string "2023-10-27"
        // Ideally we handle timezones, but for hackathon MVP assume server time or UTC is fine-ish
        // Better: use date-fns to parse dateStr as start of day in UTC or local
        const queryDate = parseISO(dateStr);
        const dayStart = startOfDay(queryDate);
        const dayEnd = endOfDay(queryDate);

        // Get existing bookings for this service (and resource?)
        // Actually need to check ALL bookings for this service's workspace if resource is shared?
        // PRD doesn't specify resource constraint. Let's assume infinite capacity per service OR single resource.
        // For a small biz (Doctor), usually single resource constraint.
        // Let's assume GLOBAL overlap check in workspace or just this service?
        // PRD says "Service based". Let's check overlap on THIS service for simplicity, 
        // BUT typically a doctor can't do 2 services at once.
        // So we should check ALL bookings for the Workspace (assuming single provider model for MVP).
        const existingBookings = await prisma.booking.findMany({
            where: {
                workspaceId: service.workspaceId, // Check workspace-wide to prevent double booking the provider
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

        // Business Hours from Service
        const [startHour, startMin] = service.startTime.split(":").map(Number);
        const [endHour, endMin] = service.endTime.split(":").map(Number);

        // Create start/end Date objects for this specific day
        let currentSlot = new Date(queryDate);
        currentSlot.setHours(startHour, startMin, 0, 0);

        const closeTime = new Date(queryDate);
        closeTime.setHours(endHour, endMin, 0, 0);

        const duration = service.duration;
        const slots = [];

        while (isBefore(currentSlot, closeTime)) {
            const slotEnd = addMinutes(currentSlot, duration);

            if (isAfter(slotEnd, closeTime)) break; // Don't go past closing

            // Check overlap
            const isOverlap = existingBookings.some(booking => {
                const bStart = new Date(booking.date);
                const bEnd = new Date(booking.endTime);

                // Overlap condition: (StartA < EndB) and (EndA > StartB)
                return isBefore(currentSlot, bEnd) && isAfter(slotEnd, bStart);
            });

            if (!isOverlap) {
                slots.push(format(currentSlot, "HH:mm"));
            }

            // Interval: for now, using duration as interval
            // Or should we use 30 min steps? 
            // Let's use duration for packed schedule.
            currentSlot = addMinutes(currentSlot, duration);
        }

        return NextResponse.json({ slots });
    } catch (error) {
        console.error("Availability Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
