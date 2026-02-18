import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyConversationIntent } from "@/lib/gemini";

/**
 *
 * @param req
 */
export async function GET(_req: Request) {
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
                    take: 5,
                    select: {
                        content: true,
                        createdAt: true,
                        isAutomated: true,
                        direction: true,
                    }
                }
            },
            orderBy: {
                lastMessageAt: 'desc',
            }
        });

        // Format for UI with intent classification
        const formatted = await Promise.all(conversations.map(async (c) => {
            // Find the last inbound message for classification
            const lastInboundMessage = c.messages.find(m => !m.isAutomated && m.direction === "INBOUND");

            let intent = null;
            if (lastInboundMessage?.content && c.unreadCount > 0) {
                try {
                    const history = c.messages
                        .filter(m => m.direction === "INBOUND" && !m.isAutomated)
                        .slice(0, 3)
                        .map(m => m.content);

                    const classification = await classifyConversationIntent(
                        lastInboundMessage.content,
                        history.length > 0 ? history : undefined
                    );

                    if (classification.confidence > 0.5) {
                        intent = {
                            type: classification.intent,
                            priority: classification.priority,
                            confidence: classification.confidence,
                            suggestedAction: classification.suggestedAction,
                        };
                    }
                } catch (e) {
                    console.error("Intent classification error:", e);
                }
            }

            return {
                id: c.id,
                contactName: c.contact.name,
                contactEmail: c.contact.email,
                contactPhone: c.contact.phone || null,
                lastMessage: c.messages[0]?.content || "No messages yet",
                lastMessageAt: c.lastMessageAt,
                unreadCount: c.unreadCount,
                intent,
            };
        }));

        // Sort by priority (high priority first)
        formatted.sort((a, b) => {
            if (a.intent?.priority === "high" && b.intent?.priority !== "high") return -1;
            if (b.intent?.priority === "high" && a.intent?.priority !== "high") return 1;
            if (a.intent?.priority === "medium" && b.intent?.priority === "low") return -1;
            if (b.intent?.priority === "medium" && a.intent?.priority === "low") return 1;
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });

        return NextResponse.json(formatted);
    } catch (_error) {
        console.error("Inbox Error:", _error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
