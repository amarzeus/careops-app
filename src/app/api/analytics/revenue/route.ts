import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Revenue analytics endpoint.
 * GET ?period=week|month|quarter — returns revenue data from completed bookings.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { workspaceId: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }

    const period = (req.nextUrl.searchParams.get("period") as string) || "month";
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        prevStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        prevStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    // Get completed bookings for current period
    const bookings = await prisma.booking.findMany({
      where: {
        workspaceId: user.workspaceId,
        status: "COMPLETED",
        date: { gte: startDate, lte: now },
      },
      include: {
        service: { select: { name: true, price: true } },
        staff: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    });

    // Get previous period bookings for comparison
    const prevBookings = await prisma.booking.findMany({
      where: {
        workspaceId: user.workspaceId,
        status: "COMPLETED",
        date: { gte: prevStartDate, lt: startDate },
      },
      include: {
        service: { select: { price: true } },
      },
    });

    // Calculate totals
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.service.price || 0), 0);
    const prevRevenue = prevBookings.reduce((sum, b) => sum + (b.service.price || 0), 0);
    const growthPct =
      prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
        : totalRevenue > 0
          ? 100
          : 0;
    const avgBookingValue =
      bookings.length > 0 ? Math.round((totalRevenue / bookings.length) * 100) / 100 : 0;

    // Daily revenue breakdown
    const dailyMap = new Map<string, number>();
    for (const b of bookings) {
      const day = b.date.toISOString().split("T")[0];
      dailyMap.set(day, (dailyMap.get(day) || 0) + (b.service.price || 0));
    }
    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by service
    const serviceMap = new Map<string, { name: string; revenue: number; count: number }>();
    for (const b of bookings) {
      const key = b.service.name;
      const entry = serviceMap.get(key) || { name: key, revenue: 0, count: 0 };
      entry.revenue += b.service.price || 0;
      entry.count += 1;
      serviceMap.set(key, entry);
    }
    const revenueByService = Array.from(serviceMap.values())
      .map((s) => ({
        ...s,
        revenue: Math.round(s.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Revenue by staff
    const staffMap = new Map<string, { name: string; revenue: number; count: number }>();
    for (const b of bookings) {
      const staffName = b.staff?.name || "Unassigned";
      const entry = staffMap.get(staffName) || {
        name: staffName,
        revenue: 0,
        count: 0,
      };
      entry.revenue += b.service.price || 0;
      entry.count += 1;
      staffMap.set(staffName, entry);
    }
    const revenueByStaff = Array.from(staffMap.values())
      .map((s) => ({
        ...s,
        revenue: Math.round(s.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      period,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      previousRevenue: Math.round(prevRevenue * 100) / 100,
      growthPercent: growthPct,
      totalBookings: bookings.length,
      avgBookingValue,
      dailyRevenue,
      revenueByService,
      revenueByStaff,
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
