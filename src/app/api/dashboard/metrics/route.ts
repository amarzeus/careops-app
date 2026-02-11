import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays, subHours } from "date-fns";
import { generateDashboardInsights } from "@/lib/gemini";

export async function GET() {
    constsession = await getServerSession(authOptions);
    // In a real app, use session.user.workspaceId
    // For prototype, we'll fetch the first active workspace or use a hardcoded fallback if needed
    // But our onboarding flow sets up a user/workspace, so we should rely on that if possible.
    // Given the current auth implementation might be mocked or minimal, let's try to find the workspace from the session or fallback.

    // FAILSAFE: If no session, try to find the most recently active workspace for demo purposes
    let workspaceId = session?.user?.workspaceId;

    if (!workspaceId) {
        const demoWs = await prisma.workspace.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { users: true }
        });
        if (demoWs) workspaceId = demoWs.id;
    }

    if (!workspaceId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);
    const nextWeek = addDays(now, 7);

    // Parallelize queries for performance
    const [
        bookingsToday,
        bookingsUpcoming,
        bookingsCompleted,
        newContacts,
        pendingForms,
        lowStockItems,
        unreadMessages,
        users
    ] = await Promise.all([
        // 1. Bookings Today
        prisma.booking.count({
            where: {
                workspaceId,
                date: { gte: dayStart, lte: dayEnd },
                status: { not: "CANCELLED" }
            }
        }),
        // 2. Upcoming Bookings (Next 7 days)
        prisma.booking.count({
            where: {
                workspaceId,
                date: { gt: dayEnd, lte: nextWeek },
                status: { not: "CANCELLED" }
            }
        }),
        // 3. Completed Bookings (All time)
        prisma.booking.count({
            where: { workspaceId, status: "COMPLETED" }
        }),
        // 4. New Contacts (Last 7 days)
        prisma.contact.count({
            where: {
                workspaceId,
                createdAt: { gte: addDays(now, -7) }
            }
        }),
        // 5. Pending Forms
        prisma.formSubmission.count({
            where: { workspaceId, status: "SENT" } // SENT means pending
        }),
        // 6. Low Stock Items
        prisma.inventoryItem.count({
            where: {
                workspaceId,
                quantity: { lte: prisma.inventoryItem.fields.threshold } // This syntax might be tricky in raw prisma count, let's use raw query or fetch and filter if needed. 
                // Actually Prisma doesn't support field comparison in where clause directly without extensions.
                // Let's fetch all items and filter in memory for now (assuming inventory isn't huge for small biz)
                // OR just fetch items where quantity is low (absolute number) if we can't do relative.
                // Correct approach for standard Prisma: fetch items and filter JS side or use raw query.
                // For Hackathon speed/simplicity with small data: Fetch all.
            }
        }),
        // 7. Unread Messages 
        prisma.message.count({
            where: {
                conversation: { workspaceId },
                direction: "INBOUND",
                isRead: false
            }
        }),
        prisma.user.findFirst({ where: { workspaceId } }) // Get business name context
    ]);

    // Fix Low Stock Count: Prisma can't compare columns in `where`. 
    // Fetch items and count manually.
    const allItems = await prisma.inventoryItem.findMany({
        where: { workspaceId },
        select: { quantity: true, threshold: true }
    });
    const lowStockCount = allItems.filter(i => i.quantity <= i.threshold).length;

    const metrics = {
        totalBookings: bookingsToday + bookingsUpcoming, // rough aggregation
        completedBookings,
        newContacts,
        pendingForms,
        lowStockItems: lowStockCount,
        unreadMessages
    };

    // AI Insights
    // We can cache this or generate on fly. For hackathon, generate on fly.
    let insights = [];
    try {
        insights = await generateDashboardInsights(metrics);
    } catch (e) {
        console.error("AI Insight Error", e);
        // Fallback insights
        insights = [{ priority: 'low', category: 'System', message: 'AI insights unavailable', action: 'Check settings' }];
    }

    return NextResponse.json({
        metrics: {
            bookingsToday,
            bookingsUpcoming,
            bookingsCompleted,
            newContacts,
            pendingForms,
            lowStockItems: lowStockCount,
            unreadMessages
        },
        insights
    });
}
