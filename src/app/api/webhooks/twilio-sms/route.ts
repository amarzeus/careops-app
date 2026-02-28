import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitSSE } from "@/app/api/events/route";

/**
 * Twilio inbound SMS webhook — receives incoming SMS messages.
 * Matches the sender to an existing contact and creates an inbox message.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;

    if (!from || !body) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Normalize phone number for matching
    const normalizedPhone = from.replace(/\D/g, "").slice(-10);
    const phoneVariants = [from, normalizedPhone, `+${normalizedPhone}`];

    // Find matching contact across workspaces
    const contact = await prisma.contact.findFirst({
      where: {
        phone: { in: phoneVariants },
      },
      include: {
        workspace: true,
        conversation: true,
      },
    });

    if (!contact) {
      console.log(`[SMS:Inbound] No contact found for ${from}`);
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Get or create conversation
    let conversationId = contact.conversation?.id;
    if (!conversationId) {
      const convo = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          workspaceId: contact.workspaceId,
          lastMessageAt: new Date(),
        },
      });
      conversationId = convo.id;
    }

    // Create message in inbox
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: body,
        direction: "inbound",
        channel: "sms",
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Emit real-time event
    emitSSE(contact.workspaceId, "message.received", {
      messageId: message.id,
      contactName: contact.name,
      content: body,
      channel: "sms",
      from,
      timestamp: new Date().toISOString(),
    });

    // Return empty TwiML response
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[SMS:Inbound] Error:", error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { "Content-Type": "text/xml" },
      status: 200,
    });
  }
}
