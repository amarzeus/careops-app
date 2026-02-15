import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 *
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const wid = user.workspaceId;

  const [
    todayBookings,
    upcomingBookings,
    completedBookings,
    noShowBookings,
    totalBookings,
    totalContacts,
    newContacts,
    totalConversations,
    unreadConversations,
    pendingForms,
    overdueForms,
    completedForms,
    allInventory,
    recentAlerts,
  ] = await Promise.all([
    prisma.booking.count({
      where: { workspaceId: wid, date: { gte: today, lt: tomorrow } },
    }),
    prisma.booking.count({
      where: {
        workspaceId: wid,
        date: { gte: tomorrow },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.booking.count({
      where: { workspaceId: wid, status: "COMPLETED" },
    }),
    prisma.booking.count({
      where: { workspaceId: wid, status: "NO_SHOW" },
    }),
    prisma.booking.count({ where: { workspaceId: wid } }),
    prisma.contact.count({ where: { workspaceId: wid } }),
    prisma.contact.count({
      where: { workspaceId: wid, createdAt: { gte: weekAgo } },
    }),
    prisma.conversation.count({ where: { workspaceId: wid } }),
    prisma.conversation.count({
      where: { workspaceId: wid, unreadCount: { gt: 0 } },
    }),
    prisma.formSubmission.count({
      where: { workspaceId: wid, status: { in: ["PENDING", "SENT"] } },
    }),
    prisma.formSubmission.count({
      where: { workspaceId: wid, status: "OVERDUE" },
    }),
    prisma.formSubmission.count({
      where: { workspaceId: wid, status: "COMPLETED" },
    }),
    prisma.inventoryItem.findMany({ where: { workspaceId: wid } }),
    prisma.alert.findMany({
      where: { workspaceId: wid },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const lowStockItems = allInventory.filter(
    (item: any) => item.quantity <= item.threshold
  );

  return NextResponse.json({
    bookings: {
      today: todayBookings,
      upcoming: upcomingBookings,
      completed: completedBookings,
      noShow: noShowBookings,
      total: totalBookings,
    },
    contacts: { total: totalContacts, new: newContacts },
    conversations: { total: totalConversations, unread: unreadConversations },
    forms: {
      pending: pendingForms,
      overdue: overdueForms,
      completed: completedForms,
    },
    inventory: { lowStock: lowStockItems },
    alerts: recentAlerts,
  });
}
