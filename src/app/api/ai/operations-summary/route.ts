import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOperationsSummary, isQuotaError, getWorkspaceGeminiModel } from "@/lib/gemini";
import { startOfDay, endOfDay } from "date-fns";

/**
 *
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the model preference for this workspace
  const model = await getWorkspaceGeminiModel(user.workspaceId);

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [
    bookingsToday,
    bookingsCompleted,
    bookingsNoShow,
    newContacts,
    unansweredMessages,
    pendingForms,
    allItems,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        workspaceId: user.workspaceId,
        date: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.booking.count({ where: { workspaceId: user.workspaceId, status: "COMPLETED" } }),
    prisma.booking.count({ where: { workspaceId: user.workspaceId, status: "NO_SHOW" } }),
    prisma.contact.count({
      where: { workspaceId: user.workspaceId, createdAt: { gte: dayStart } },
    }),
    prisma.message.count({
      where: {
        conversation: { workspaceId: user.workspaceId },
        direction: "INBOUND",
        status: { not: "READ" },
      },
    }),
    prisma.formSubmission.count({
      where: { workspaceId: user.workspaceId, status: { in: ["PENDING", "SENT"] } },
    }),
    prisma.inventoryItem.findMany({
      where: { workspaceId: user.workspaceId },
      select: { quantity: true, threshold: true },
    }),
  ]);

  const lowStockItems = allItems.filter(
    (i: { quantity: number; threshold: number }) => i.quantity <= i.threshold
  ).length;
  const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });

  try {
    const summary = await generateOperationsSummary(
      {
        bookingsToday,
        bookingsCompleted,
        bookingsNoShow,
        newContacts,
        unansweredMessages,
        pendingForms,
        lowStockItems,
        businessName: workspace?.name || "Your Business",
      },
      model
    );

    return NextResponse.json({ summary });
  } catch (error) {
    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          error: "AI limit reached",
          message: "Operations summary is temporarily unavailable.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Summary generation failed" }, { status: 500 });
  }
}
