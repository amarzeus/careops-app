import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { addDays, addWeeks, addMonths } from "date-fns";

/**
 * Handle POST /api/bookings/recurring
 * Creates a series of recurring bookings.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { workspaceId: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }

    const body = await req.json();
    const {
      date, // Initial start date
      endTime, // Initial end time
      serviceId,
      contactId,
      staffId,
      locationId,
      notes,
      recurringPattern, // e.g. "DAILY", "WEEKLY", "MONTHLY"
      occurrences = 5, // Default number of occurrences in the series to generate
    } = body;

    if (!date || !endTime || !serviceId || !contactId || !recurringPattern) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate bounds for massive recurring generation
    const limit = Math.min(Math.max(Number(occurrences), 2), 52);

    const service = await prisma.service.findUnique({
      where: { id: serviceId, workspaceId: user.workspaceId },
    });

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const recurringGroupId = Math.random().toString(36).substring(2, 10);
    const bookingsData = [];

    let currentStart = new Date(date);
    let currentEnd = new Date(endTime);

    for (let i = 0; i < limit; i++) {
      bookingsData.push({
        date: new Date(currentStart),
        endTime: new Date(currentEnd),
        serviceId,
        contactId,
        staffId: staffId || null,
        locationId: locationId || null,
        workspaceId: user.workspaceId,
        notes: notes || null,
        status: "PENDING",
        recurringPattern,
        recurringGroupId,
      });

      // Increment dates for the next iteration
      if (recurringPattern === "DAILY") {
        currentStart = addDays(currentStart, 1);
        currentEnd = addDays(currentEnd, 1);
      } else if (recurringPattern === "WEEKLY") {
        currentStart = addWeeks(currentStart, 1);
        currentEnd = addWeeks(currentEnd, 1);
      } else if (recurringPattern === "MONTHLY") {
        currentStart = addMonths(currentStart, 1);
        currentEnd = addMonths(currentEnd, 1);
      } else {
        break; // Unknown pattern
      }
    }

    if (bookingsData.length === 0) {
      return NextResponse.json({ error: "Failed to generate occurrences" }, { status: 400 });
    }

    // Execute bulk insert
    await prisma.booking.createMany({
      data: bookingsData,
    });

    // Optionally fetch them back if needed, or simply return the count
    const bookings = await prisma.booking.findMany({
      where: { recurringGroupId, workspaceId: user.workspaceId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(bookings, { status: 201 });
  } catch (error) {
    console.error("Failed to create recurring bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
