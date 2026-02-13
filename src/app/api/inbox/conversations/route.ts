import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "OWNER" && !user.canAccessInbox) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                workspaceId: user.workspaceId,
                isActive: true,
            },
            include: {
                contact: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        content: true,
                        createdAt: true,
                        isAutomated: true,
                    }
                }
            },
            orderBy: {
                lastMessageAt: 'desc',
            }
        });

        // Format for UI
        const formatted = conversations.map(c => ({
            id: c.id,
            contactName: c.contact.name,
            contactEmail: c.contact.email,
            contactPhone: c.contact.phone || null,
            lastMessage: c.messages[0]?.content || "No messages yet",
            lastMessageAt: c.lastMessageAt,
            unreadCount: c.unreadCount,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Inbox Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
