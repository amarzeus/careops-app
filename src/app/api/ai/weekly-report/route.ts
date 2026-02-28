import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyReport } from "@/lib/gemini";

/**
 * GET /api/ai/weekly-report
 * Generates an AI-powered weekly business report from the past 7 days of workspace data.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = user.workspaceId;

  // Date range: last 7 days
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  try {
    // Parallel data fetches
    const [
      workspace,
      bookingsTotal,
      bookingsCompleted,
      bookingsCancelled,
      newContacts,
      messagesReceived,
      lowStockItems,
      staffCount,
      topServicesRaw,
    ] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      }),
      prisma.booking.count({
        where: { workspaceId, date: { gte: weekAgo } },
      }),
      prisma.booking.count({
        where: { workspaceId, date: { gte: weekAgo }, status: "COMPLETED" },
      }),
      prisma.booking.count({
        where: { workspaceId, date: { gte: weekAgo }, status: "CANCELLED" },
      }),
      prisma.contact.count({
        where: { workspaceId, createdAt: { gte: weekAgo } },
      }),
      prisma.message.count({
        where: {
          conversation: { workspaceId },
          direction: "INBOUND",
          createdAt: { gte: weekAgo },
        },
      }),
      prisma.inventoryItem.count({
        where: {
          workspaceId,
          quantity: { lte: prisma.inventoryItem.fields.threshold as never },
        },
      }),
      prisma.user.count({ where: { workspaceId } }),
      prisma.booking.groupBy({
        by: ["serviceId"],
        where: { workspaceId, date: { gte: weekAgo } },
        _count: { serviceId: true },
        orderBy: { _count: { serviceId: "desc" } },
        take: 5,
      }),
    ]);

    // Resolve service names for top services
    const serviceIds = topServicesRaw.map((s) => s.serviceId);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });
    const serviceNameMap = new Map(services.map((s) => [s.id, s.name]));
    const topServices = topServicesRaw.map((s) => ({
      name: serviceNameMap.get(s.serviceId) || "Unknown",
      count: s._count.serviceId,
    }));

    // Count low stock manually (Prisma doesn't support field-to-field comparison in SQLite well)
    const lowStockCount =
      lowStockItems ||
      (await prisma
        .$queryRawUnsafe<[{ count: number }]>(
          `SELECT COUNT(*) as count FROM "InventoryItem" WHERE "workspaceId" = $1 AND "quantity" <= "threshold"`,
          workspaceId
        )
        .then((r) => Number(r[0]?.count || 0))
        .catch(() => 0));

    const reportData = {
      businessName: workspace?.name || "Your Business",
      periodStart: weekAgo.toISOString().split("T")[0],
      periodEnd: now.toISOString().split("T")[0],
      bookingsTotal,
      bookingsCompleted,
      bookingsCancelled,
      newContacts,
      messagesReceived,
      avgSentimentScore: null,
      lowStockCount: typeof lowStockCount === "number" ? lowStockCount : 0,
      topServices,
      staffCount,
    };

    const report = await generateWeeklyReport(reportData);

    return NextResponse.json({ report, data: reportData });
  } catch (error) {
    console.error("Weekly report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
