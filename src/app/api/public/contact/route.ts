import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerAutomation } from "@/lib/automation";
import { checkRateLimit, RATE_LIMITS, getClientIP } from "@/lib/rate-limiter";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(req);
    const identifier = `${clientIP}:contact`;
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.CONTACT_FORM);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          message: "Too many submissions. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS.CONTACT_FORM.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
          }
        }
      );
    }

    const { formSlug, data } = await req.json();
    if (!formSlug || !data?.name)
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );

    const form = await prisma.contactForm.findUnique({
      where: { slug: formSlug },
      include: { workspace: true },
    });
    if (!form || !form.isActive)
      return NextResponse.json({ error: "Form not found" }, { status: 404 });

    // Find or create contact
    let contact = data.email
      ? await prisma.contact.findFirst({
          where: { email: data.email, workspaceId: form.workspaceId },
        })
      : null;

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          source: "form",
          workspaceId: form.workspaceId,
        },
      });
    }

    // Create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { contactId: contact.id },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          workspaceId: form.workspaceId,
          subject: `New inquiry from ${data.name}`,
        },
      });
    }

    // Save message if there's one
    if (data.message) {
      await prisma.message.create({
        data: {
          content: data.message,
          channel: "EMAIL",
          direction: "INBOUND",
          conversationId: conversation.id,
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
        },
      });
    }

    // Trigger automation
    await triggerAutomation(form.workspaceId, "NEW_CONTACT", { contact });

    return NextResponse.json({
      success: true,
      message:
        form.welcomeMessage ||
        "Thank you for contacting us! We will get back to you soon.",
    });
  } catch (error) {
    console.error("Public contact error:", error);
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 }
    );
  }
}
