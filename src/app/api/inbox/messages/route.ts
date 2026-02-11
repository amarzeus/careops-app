import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildEmailTemplate } from "@/lib/email";

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
        return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    try {
        // Verify access
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });

        if (!conversation || conversation.workspaceId !== user.workspaceId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Mark as read
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { unreadCount: 0 }
        });

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { name: true } } }
        });

        return NextResponse.json({ conversation, messages });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { conversationId, content } = body;

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true, workspace: true }
        });

        if (!conversation || conversation.workspaceId !== user.workspaceId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // 1. Create Message
        const message = await prisma.message.create({
            data: {
                conversationId,
                content,
                direction: "OUTBOUND",
                channel: "EMAIL", // Default for now
                senderId: user.id,
                status: "SENT"
            }
        });

        // 2. Update Conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() }
        });

        // 3. Send actual Email (if configured)
        if (conversation.workspace.emailConfigured && conversation.contact.email) {
            try {
                await sendEmail({
                    to: conversation.contact.email,
                    subject: conversation.subject || `Message from ${conversation.workspace.name}`,
                    html: buildEmailTemplate("New Message", `<p>${content}</p>`)
                });
                await prisma.message.update({
                    where: { id: message.id },
                    data: { status: "DELIVERED" } // Optimistic
                });
            } catch (err) {
                console.error("Failed to send email reply", err);
                await prisma.message.update({
                    where: { id: message.id },
                    data: { status: "FAILED" }
                });
            }
        }

        return NextResponse.json(message);
    } catch (error) {
        console.error("Reply Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
