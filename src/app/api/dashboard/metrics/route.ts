import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays, subDays } from "date-fns";
import { generateDashboardInsights } from "@/lib/gemini";

/** PRD Section 5 — Dashboard Metrics API
 *  Returns all data needed for the Command Center:
 *  1. Booking Overview (today, upcoming, completed, no-show, unconfirmed)
 *  2. Leads & Conversations (new inquiries, ongoing, unanswered)
 *  3. Forms Status (pending, overdue, completed)
 *  4. Inventory Alerts (low-stock, critical)
 *  5. Key Alerts with actionable links
 *  6. Weekly trend data for the performance chart
 */
export async function GET() {
  const user = await getCurrentUser();
  const workspaceId = user?.workspaceId;

  if (!workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const nextWeek = addDays(now, 7);
  const last7Days = subDays(now, 7);

  // ──── Parallelize ALL queries ────
  const [
    bookingsTodayList,
    bookingsUpcoming,
    bookingsCompleted,
    bookingsNoShow,
    bookingsUnconfirmed,
    newContacts,
    totalContacts,
    ongoingConversations,
    unansweredMessages,
    pendingForms,
    overdueForms,
    completedForms,
    totalFormSubmissions,
    allInventoryItems,
    unresolvedAlerts,
    recentBookings7d,
    recentContacts7d,
    recentBookingsActivity,
    recentFormActivity,
    recentContactActivity,
  ] = await Promise.all([
    // 1. Bookings Today (full objects for schedule)
    prisma.booking.findMany({
      where: {
        workspaceId,
        date: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
      },
      include: { service: true, contact: true },
      orderBy: { date: "asc" },
    }),
    // 2. Upcoming Bookings (next 7 days)
    prisma.booking.count({
      where: {
        workspaceId,
        date: { gt: dayEnd, lte: nextWeek },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    // 3. Completed Bookings (all time)
    prisma.booking.count({
      where: { workspaceId, status: "COMPLETED" },
    }),
    // 4. No-Show Count
    prisma.booking.count({
      where: { workspaceId, status: "NO_SHOW" },
    }),
    // 5. Unconfirmed Bookings
    prisma.booking.count({
      where: { workspaceId, status: "PENDING" },
    }),
    // 6. New Contacts (last 7 days)
    prisma.contact.count({
      where: { workspaceId, createdAt: { gte: last7Days } },
    }),
    // 7. Total Contacts
    prisma.contact.count({
      where: { workspaceId },
    }),
    // 8. Ongoing Conversations
    prisma.conversation.count({
      where: { workspaceId, isActive: true },
    }),
    // 9. Unanswered Messages (inbound, not read)
    prisma.message.count({
      where: {
        conversation: { workspaceId },
        direction: "INBOUND",
        status: { not: "READ" },
      },
    }),
    // 10. Pending Forms
    prisma.formSubmission.count({
      where: { workspaceId, status: { in: ["PENDING", "SENT"] } },
    }),
    // 11. Overdue Forms
    prisma.formSubmission.count({
      where: { workspaceId, status: "OVERDUE" },
    }),
    // 12. Completed Forms
    prisma.formSubmission.count({
      where: { workspaceId, status: "COMPLETED" },
    }),
    // 13. Total Form Submissions
    prisma.formSubmission.count({
      where: { workspaceId },
    }),
    // 14. All Inventory Items (for threshold comparison)
    prisma.inventoryItem.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        quantity: true,
        threshold: true,
        unit: true,
      },
    }),
    // 15. Unresolved Alerts
    prisma.alert.findMany({
      where: { workspaceId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // 16. Bookings in last 7 days (for chart)
    prisma.booking.findMany({
      where: { workspaceId, createdAt: { gte: last7Days } },
      select: { createdAt: true, status: true },
    }),
    // 17. Contacts in last 7 days (for chart)
    prisma.contact.findMany({
      where: { workspaceId, createdAt: { gte: last7Days } },
      select: { createdAt: true },
    }),
    // 18. Recent bookings for activity feed
    prisma.booking.findMany({
      where: { workspaceId },
      include: { service: true, contact: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // 19. Recent form submissions for activity feed
    prisma.formSubmission.findMany({
      where: { workspaceId },
      include: { contact: true, intakeForm: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // 20. Recent contacts for activity feed
    prisma.contact.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  // ──── Compute derived metrics ────
  const lowStockItems = allInventoryItems.filter(
    (i) => i.quantity <= i.threshold
  );
  const criticalItems = allInventoryItems.filter(
    (i) => i.quantity === 0 || i.quantity <= Math.floor(i.threshold * 0.3)
  );

  // ──── Build weekly chart data ────
  const chartData = [];
  for (let d = 6; d >= 0; d--) {
    const date = subDays(now, d);
    const ds = startOfDay(date).getTime();
    const dateStr = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayBookings = recentBookings7d.filter(
      (b) => startOfDay(new Date(b.createdAt)).getTime() === ds
    );
    const dayContacts = recentContacts7d.filter(
      (c) => startOfDay(new Date(c.createdAt)).getTime() === ds
    );
    chartData.push({
      name: dateStr,
      bookings: dayBookings.length,
      leads: dayContacts.length,
      completed: dayBookings.filter((b) => b.status === "COMPLETED").length,
    });
  }

  // ──── Build Key Alerts (PRD: every alert links to exact action) ────
  type AlertItem = {
    priority: "critical" | "high" | "medium" | "low";
    category: string;
    message: string;
    action: string;
    link: string;
  };
  const keyAlerts: AlertItem[] = [];

  if (unansweredMessages > 0) {
    keyAlerts.push({
      priority: "critical",
      category: "Communication",
      message: `${unansweredMessages} unanswered message${unansweredMessages > 1 ? "s" : ""} waiting for reply`,
      action: "Open Inbox",
      link: "/inbox",
    });
  }
  if (bookingsUnconfirmed > 0) {
    keyAlerts.push({
      priority: "high",
      category: "Bookings",
      message: `${bookingsUnconfirmed} unconfirmed booking${bookingsUnconfirmed > 1 ? "s" : ""} need attention`,
      action: "Review Bookings",
      link: "/bookings",
    });
  }
  if (overdueForms > 0) {
    keyAlerts.push({
      priority: "high",
      category: "Forms",
      message: `${overdueForms} overdue form${overdueForms > 1 ? "s" : ""} past deadline`,
      action: "View Forms",
      link: "/forms",
    });
  }
  if (pendingForms > 0) {
    keyAlerts.push({
      priority: "medium",
      category: "Forms",
      message: `${pendingForms} form${pendingForms > 1 ? "s" : ""} waiting for completion`,
      action: "View Submissions",
      link: "/forms",
    });
  }
  if (criticalItems.length > 0) {
    keyAlerts.push({
      priority: "critical",
      category: "Inventory",
      message: `${criticalItems.length} item${criticalItems.length > 1 ? "s" : ""} critically low or out of stock`,
      action: "Manage Inventory",
      link: "/inventory",
    });
  } else if (lowStockItems.length > 0) {
    keyAlerts.push({
      priority: "high",
      category: "Inventory",
      message: `${lowStockItems.length} item${lowStockItems.length > 1 ? "s" : ""} below restock threshold`,
      action: "Check Inventory",
      link: "/inventory",
    });
  }

  // ──── AI Insights (non-blocking) ────
  const metricsForAI = {
    totalBookings: bookingsTodayList.length + bookingsUpcoming,
    completedBookings: bookingsCompleted,
    newContacts,
    pendingForms,
    lowStockItems: lowStockItems.length,
    unreadMessages: unansweredMessages,
  };

  let aiInsights: Array<{
    priority: "high" | "medium" | "low";
    category: string;
    message: string;
    action: string;
  }> = [];
  try {
    aiInsights = await generateDashboardInsights(metricsForAI);
  } catch {
    aiInsights = [];
  }

  return NextResponse.json({
    metrics: {
      bookingsToday: bookingsTodayList.length,
      bookingsUpcoming,
      bookingsCompleted,
      bookingsNoShow,
      bookingsUnconfirmed,
      newContacts,
      totalContacts,
      ongoingConversations,
      unansweredMessages,
      pendingForms,
      overdueForms,
      completedForms,
      totalFormSubmissions,
      lowStockItems: lowStockItems.length,
      criticalItems: criticalItems.length,
      totalInventoryItems: allInventoryItems.length,
    },
    todaysBookings: bookingsTodayList.map((b) => ({
      id: b.id,
      time: new Date(b.date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      service: b.service.name,
      contact: b.contact.name,
      status: b.status,
    })),
    chartData,
    keyAlerts,
    aiInsights,
    lowStockDetails: lowStockItems.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      threshold: i.threshold,
      unit: i.unit,
    })),
    recentActivity: [
      ...recentBookingsActivity.map((b: { id: string; createdAt: Date; status: string; contact: { name: string }; service: { name: string } }) => ({
        id: `booking-${b.id}`,
        type: "booking",
        message: `Booking ${b.status.toLowerCase()} — ${b.contact.name} for ${b.service.name}`,
        timestamp: b.createdAt.toISOString(),
        link: "/bookings",
      })),
      ...recentFormActivity.map((f: { id: string; createdAt: Date; status: string; contact: { name: string }; intakeForm: { name: string } | null }) => ({
        id: `form-${f.id}`,
        type: "form",
        message: `Form ${f.status.toLowerCase()} — ${f.contact.name}${f.intakeForm ? ` (${f.intakeForm.name})` : ""}`,
        timestamp: f.createdAt.toISOString(),
        link: "/forms",
      })),
      ...recentContactActivity.map((c: { id: string; createdAt: Date; name: string }) => ({
        id: `contact-${c.id}`,
        type: "contact",
        message: `New contact — ${c.name}`,
        timestamp: c.createdAt.toISOString(),
        link: "/inbox",
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10),
  });
}
