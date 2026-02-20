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

    // Find form by slug or workspaceId
    const form = await prisma.contactForm.findFirst({
      where: {
        OR: [
          { slug: formSlug },
          { workspaceId: formSlug, isActive: true }
        ]
      },
      include: { workspace: true },
    });

    let workspaceId = form?.workspaceId;
    const welcomeMessage = form?.welcomeMessage;

    if (!form || !form.isActive) {
      // If no form found, check if formSlug is a valid workspaceId (Default Form)
      const workspace = await prisma.workspace.findUnique({
        where: { id: formSlug },
      });

      if (!workspace) {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }

      workspaceId = workspace.id;
    }

    // Find or create contact
    let contact = data.email
      ? await prisma.contact.findFirst({
        where: { email: data.email, workspaceId: workspaceId! },
      })
      : null;

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          source: "form",
          workspaceId: workspaceId!,
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
          workspaceId: workspaceId!,
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
    await triggerAutomation(workspaceId!, "NEW_CONTACT", { contact });

    return NextResponse.json({
      success: true,
      message:
        welcomeMessage ||
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
