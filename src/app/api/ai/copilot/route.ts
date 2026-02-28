import { NextResponse } from "next/server";
import { aiDashboardCopilot, isQuotaError } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ai/copilot
 * Dashboard Co-pilot: answers operational questions using real workspace data.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { message, conversationHistory } = body;
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const workspaceId = user.workspaceId;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch workspace data in parallel
    const [
      workspace,
      bookingStats,
      todaysBookings,
      totalContacts,
      newContactsThisWeek,
      unreadConversations,
      lowStockItems,
      pendingForms,
      recentAlerts,
      staffCount,
    ] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      }),
      prisma.booking.groupBy({
        by: ["status"],
        where: { workspaceId },
        _count: { id: true },
      }),
      prisma.booking.findMany({
        where: {
          workspaceId,
          date: { gte: startOfDay, lt: endOfDay },
        },
        include: {
          service: { select: { name: true } },
          contact: { select: { name: true } },
        },
        orderBy: { date: "asc" },
        take: 20,
      }),
      prisma.contact.count({ where: { workspaceId } }),
      prisma.contact.count({
        where: { workspaceId, createdAt: { gte: oneWeekAgo } },
      }),
      prisma.conversation.aggregate({
        where: { workspaceId, unreadCount: { gt: 0 } },
        _sum: { unreadCount: true },
      }),
      prisma.inventoryItem.findMany({
        where: {
          workspaceId,
          quantity: { lte: prisma.inventoryItem.fields.threshold },
        },
        select: { name: true, quantity: true, threshold: true },
        take: 10,
      }),
      prisma.formSubmission.count({
        where: { workspaceId, status: "PENDING" },
      }),
      prisma.alert.findMany({
        where: { workspaceId, isRead: false },
        select: { type: true, title: true, message: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.user.count({ where: { workspaceId } }),
    ]);

    // Parse booking stats
    const statusCounts: Record<string, number> = {};
    for (const stat of bookingStats) {
      statusCounts[stat.status] = stat._count.id;
    }
    const totalBookings = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    // Build workspace context
    const workspaceContext = {
      businessName: workspace?.name || "Your Business",
      totalBookings,
      upcomingBookings: (statusCounts["PENDING"] || 0) + (statusCounts["CONFIRMED"] || 0),
      completedBookings: statusCounts["COMPLETED"] || 0,
      cancelledBookings: statusCounts["CANCELLED"] || 0,
      totalContacts,
      newContactsThisWeek,
      unreadMessages: unreadConversations._sum.unreadCount || 0,
      lowStockItems: lowStockItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        threshold: item.threshold,
      })),
      todaysBookings: todaysBookings.map((b) => ({
        service: b.service.name,
        contact: b.contact.name,
        time: b.date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        status: b.status,
      })),
      recentAlerts: recentAlerts.map((a) => ({
        type: a.type,
        title: a.title,
        message: a.message,
      })),
      pendingForms,
      staffCount,
    };

    const response = await aiDashboardCopilot(
      message,
      workspaceContext,
      conversationHistory || [],
      "gemini-2.5-flash-lite"
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Co-pilot Error:", error);
    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          message: "The AI co-pilot is at capacity. Please try again in a moment.",
          suggestedActions: [{ label: "View Dashboard", action: "/dashboard" }],
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      {
        message: "An error occurred. Please try again.",
        suggestedActions: [],
      },
      { status: 500 }
    );
  }
}
