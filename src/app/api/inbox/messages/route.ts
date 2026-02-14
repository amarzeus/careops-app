import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildEmailTemplate } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { sendTextMessage as sendWhatsAppMessage, isAvailable as isWhatsAppAvailable } from "@/lib/whatsapp";

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
        const { conversationId, content, channel: requestedChannel } = body;

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true, workspace: true }
        });

        if (!conversation || conversation.workspaceId !== user.workspaceId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Determine the best delivery channel
        const contact = conversation.contact;
        const workspace = conversation.workspace;
        let deliveryChannel: "EMAIL" | "SMS" | "WHATSAPP" = "EMAIL";

        if (requestedChannel === "whatsapp" && contact.phone && isWhatsAppAvailable()) {
            deliveryChannel = "WHATSAPP";
        } else if (requestedChannel === "sms" && contact.phone && workspace.smsConfigured) {
            deliveryChannel = "SMS";
        } else if (contact.email && workspace.emailConfigured) {
            deliveryChannel = "EMAIL";
        } else if (contact.phone && isWhatsAppAvailable()) {
            deliveryChannel = "WHATSAPP";
        } else if (contact.phone && workspace.smsConfigured) {
            deliveryChannel = "SMS";
        }

        // 1. Create Message
        const message = await prisma.message.create({
            data: {
                conversationId,
                content,
                direction: "OUTBOUND",
                channel: deliveryChannel,
                senderId: user.id,
                status: "SENT"
            }
        });

        // 2. Update Conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() }
        });

        // 3. Deliver via selected channel
        let delivered = false;

        switch (deliveryChannel) {
            case "EMAIL":
                if (workspace.emailConfigured && contact.email) {
                    try {
                        await sendEmail({
                            to: contact.email,
                            subject: conversation.subject || `Message from ${workspace.name}`,
                            html: buildEmailTemplate("New Message", `<p>${content}</p>`)
                        });
                        delivered = true;
                    } catch (err) {
                        console.error("Failed to send email reply", err);
                    }
                }
                break;

            case "WHATSAPP":
                if (contact.phone) {
                    try {
                        const result = await sendWhatsAppMessage(contact.phone, content);
                        delivered = result.success;
                    } catch (err) {
                        console.error("Failed to send WhatsApp reply", err);
                    }
                }
                break;

            case "SMS":
                if (contact.phone) {
                    try {
                        delivered = await sendSMS({ to: contact.phone, body: content });
                    } catch (err) {
                        console.error("Failed to send SMS reply", err);
                    }
                }
                break;
        }

        // Update message status
        await prisma.message.update({
            where: { id: message.id },
            data: { status: delivered ? "DELIVERED" : "FAILED" }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error("Reply Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
