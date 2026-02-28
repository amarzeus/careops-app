import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Retrieves analytics for staff.
 * @param req
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { workspaceId: true, role: true },
    });

    if (!currentUser?.workspaceId) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }

    if (currentUser.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";

    const startDate = new Date();
    if (period === "week") startDate.setDate(startDate.getDate() - 7);
    else if (period === "month") startDate.setMonth(startDate.getMonth() - 1);
    else if (period === "quarter") startDate.setMonth(startDate.getMonth() - 3);

    // Fetch all staff members in the workspace
    const staffMembers = await prisma.user.findMany({
      where: { workspaceId: currentUser.workspaceId, role: "STAFF" },
      include: {
        assignedBookings: {
          where: {
            status: "COMPLETED",
            date: { gte: startDate },
          },
          include: {
            service: true,
          },
        },
      },
    });

    const performanceData = staffMembers.map((staff) => {
      let totalRevenueGenerated = 0;
      let totalMinutesWorked = 0;
      let completedBookings = 0;

      for (const booking of staff.assignedBookings) {
        if (booking.service) {
          totalRevenueGenerated += booking.service.price;
          totalMinutesWorked += booking.service.duration;
          completedBookings++;
        }
      }

      const commissionRate = staff.commissionRate || 0;
      const estimatedCommissions = totalRevenueGenerated * commissionRate;

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatar: null,
        commissionRate,
        completedBookings,
        totalRevenueGenerated,
        estimatedCommissions,
        totalHoursWorked: Math.round((totalMinutesWorked / 60) * 10) / 10,
        // Mock utilization calculation for demonstration
        utilizationScore: Math.min(100, Math.round((totalMinutesWorked / (40 * 60)) * 100)),
      };
    });

    return NextResponse.json({ data: performanceData }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch staff performance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
