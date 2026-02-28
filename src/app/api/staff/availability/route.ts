import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/staff/availability?date=YYYY-MM-DD&serviceId=...
 * Returns all staff available for a given date/service, accounting for
 * their weekly schedule and existing bookings.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date");
  const serviceId = url.searchParams.get("serviceId");

  if (!dateStr) {
    return NextResponse.json(
      { error: "date query parameter is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dayOfWeek = targetDate.getDay(); // 0=Sun, 6=Sat

  // 1. Get all staff in the workspace
  const allStaff = await prisma.user.findMany({
    where: { workspaceId: user.workspaceId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      schedule: {
        where: { dayOfWeek },
      },
    },
  });

  // 2. Get beginning/end of day for booking conflict check
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // 3. Get existing bookings on this date
  const existingBookings = await prisma.booking.findMany({
    where: {
      workspaceId: user.workspaceId,
      date: { gte: dayStart, lte: dayEnd },
      status: { not: "CANCELLED" },
      staffId: { not: null },
    },
    select: {
      staffId: true,
      date: true,
      endTime: true,
      serviceId: true,
    },
  });

  // 4. Build a map of staff bookings
  const staffBookingMap = new Map<string, typeof existingBookings>();
  for (const booking of existingBookings) {
    const list = staffBookingMap.get(booking.staffId!) || [];
    list.push(booking);
    staffBookingMap.set(booking.staffId!, list);
  }

  // 5. Service duration (if provided) for slot calculation
  let serviceDuration = 60; // default 60min
  if (serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true },
    });
    if (service) serviceDuration = service.duration;
  }

  // 6. Build availability result
  const availability = allStaff.map((staff) => {
    const scheduleEntry = staff.schedule[0];
    const isScheduledToday = scheduleEntry ? scheduleEntry.isAvailable : true; // Default: available if no schedule set

    const workStart = scheduleEntry?.startTime || "09:00";
    const workEnd = scheduleEntry?.endTime || "17:00";

    const bookingsToday = staffBookingMap.get(staff.id) || [];
    const bookedSlots = bookingsToday.map((b) => ({
      start: b.date.toISOString(),
      end: b.endTime.toISOString(),
    }));

    return {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      isAvailableToday: isScheduledToday,
      workStart,
      workEnd,
      bookedSlots,
      bookingCount: bookingsToday.length,
      serviceDuration,
    };
  });

  return NextResponse.json({
    date: dateStr,
    dayOfWeek,
    availability: availability.filter((a) => a.isAvailableToday),
    unavailable: availability.filter((a) => !a.isAvailableToday),
  });
}
