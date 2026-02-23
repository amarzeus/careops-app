import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeOperationsAnomalies, isQuotaError, getWorkspaceGeminiModel } from "@/lib/gemini";
import { subDays } from "date-fns";

/** GET /api/ai/anomalies
 *  Detects operational anomalies by analyzing business metrics
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = user.workspaceId;

  // Get the model preference for this workspace
  const model = await getWorkspaceGeminiModel(workspaceId);

  const now = new Date();
  const thisWeekStart = subDays(now, 7);
  const lastWeekStart = subDays(now, 14);

  try {
    const [
      bookingsThisWeek,
      bookingsLastWeek,
      totalBookings,
      noShowBookings,
      newContactsThisWeek,
      newContactsLastWeek,
      pendingForms,
      overdueForms,
      totalItems,
      lowStockItems,
      unansweredMessages,
    ] = await Promise.all([
      prisma.booking.count({ where: { workspaceId, createdAt: { gte: thisWeekStart } } }),
      prisma.booking.count({
        where: { workspaceId, createdAt: { gte: lastWeekStart, lt: thisWeekStart } },
      }),
      prisma.booking.count({ where: { workspaceId } }),
      prisma.booking.count({ where: { workspaceId, status: "NO_SHOW" } }),
      prisma.contact.count({ where: { workspaceId, createdAt: { gte: thisWeekStart } } }),
      prisma.contact.count({
        where: { workspaceId, createdAt: { gte: lastWeekStart, lt: thisWeekStart } },
      }),
      prisma.formSubmission.count({ where: { workspaceId, status: { in: ["PENDING", "SENT"] } } }),
      prisma.formSubmission.count({ where: { workspaceId, status: "OVERDUE" } }),
      prisma.inventoryItem.count({ where: { workspaceId } }),
      prisma.inventoryItem.count({
        where: {
          workspaceId,
          quantity: { lte: prisma.inventoryItem.fields.threshold as unknown as number },
        },
      }),
      prisma.message.count({
        where: { conversation: { workspaceId }, direction: "INBOUND", status: { not: "READ" } },
      }),
    ]);

    const noShowRate = totalBookings > 0 ? noShowBookings / totalBookings : 0;

    const anomalies = await analyzeOperationsAnomalies(
      {
        bookingsThisWeek,
        bookingsLastWeek,
        noShowRate,
        averageNoShowRate: 0.1, // Default avg
        newContactsThisWeek,
        newContactsLastWeek,
        pendingForms,
        overdueForms,
        lowStockItems,
        totalItems,
        unansweredMessages,
      },
      model
    );

    return NextResponse.json({ anomalies });
  } catch (error) {
    console.error("Anomaly detection error:", error);
    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          error: "AI limit reached",
          message: "Anomaly detection is temporarily unavailable.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Anomaly detection failed" }, { status: 500 });
  }
}
