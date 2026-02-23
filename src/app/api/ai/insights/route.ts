/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDashboardInsights, getWorkspaceGeminiModel } from "@/lib/gemini";

/**
 *
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wid = user.workspaceId;

  // Get the model preference for this workspace
  const model = await getWorkspaceGeminiModel(wid);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    totalBookings,
    completedBookings,
    newContacts,
    pendingForms,
    allInventory,
    unreadMessages,
  ] = await Promise.all([
    prisma.booking.count({ where: { workspaceId: wid } }),
    prisma.booking.count({
      where: { workspaceId: wid, status: "COMPLETED" },
    }),
    prisma.contact.count({
      where: { workspaceId: wid, createdAt: { gte: weekAgo } },
    }),
    prisma.formSubmission.count({
      where: { workspaceId: wid, status: { in: ["PENDING", "SENT"] } },
    }),
    prisma.inventoryItem.findMany({ where: { workspaceId: wid } }),
    prisma.conversation.count({
      where: { workspaceId: wid, unreadCount: { gt: 0 } },
    }),
  ]);

  const lowStockItems = allInventory.filter((item: any) => item.quantity <= item.threshold).length;

  const insights = await generateDashboardInsights(
    {
      totalBookings,
      completedBookings,
      newContacts,
      pendingForms,
      lowStockItems,
      unreadMessages,
    },
    model
  );

  return NextResponse.json({ insights });
}
