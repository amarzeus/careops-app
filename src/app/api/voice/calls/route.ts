import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeVoicePhoneNumber } from "@/lib/voice-compliance";
import { initiateOutboundCall, isVapiConfigured } from "@/lib/vapi";

/**
 *
 * @param req
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isVapiConfigured()) {
      return NextResponse.json(
        { error: "VAPI not configured. Please add VAPI_API_KEY to environment." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { phoneNumber, contactId, agentId, purpose, notes } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const workspaceId = user.workspaceId;
    const normalizedPhone = normalizeVoicePhoneNumber(phoneNumber);

    const dncEntry = await prisma.doNotCallEntry.findFirst({
      where: {
        workspaceId,
        isActive: true,
        OR: [{ phoneNumber }, { phoneNumber: normalizedPhone }],
      },
      select: { id: true },
    });

    if (dncEntry) {
      await prisma.voiceCall.create({
        data: {
          direction: "OUTBOUND",
          status: "SKIPPED",
          workspaceId,
          outcome: "DNC_SKIP",
          metadata: JSON.stringify({ purpose, notes, phoneNumber: normalizedPhone, reason: "dnc" }),
        },
      });

      return NextResponse.json(
        { error: "Outbound calls to this number are blocked by Do Not Call policy" },
        { status: 403 }
      );
    }

    let contact = null;

    if (contactId) {
      contact = await prisma.contact.findFirst({
        where: {
          id: contactId,
          workspaceId,
        },
      });
    } else if (phoneNumber) {
      contact = await prisma.contact.findFirst({
        where: {
          phone: phoneNumber,
          workspaceId,
        },
      });
    }

    let assistantId: string | undefined;
    if (agentId) {
      const agent = await prisma.voiceAgent.findFirst({
        where: {
          id: agentId,
          workspaceId,
          isActive: true,
        },
      });
      assistantId = agent?.vapiAssistantId || undefined;
    }

    const result = await initiateOutboundCall({
      phoneNumber,
      workspaceId,
      contactId: contact?.id,
      contactName: contact?.name,
      assistantId,
      metadata: {
        purpose,
        notes,
        initiatedBy: user.email,
        contactPhone: normalizedPhone,
        retryCount: 0,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to initiate call" },
        { status: 500 }
      );
    }

    const voiceCall = await prisma.voiceCall.create({
      data: {
        callSid: result.callId,
        direction: "OUTBOUND",
        status: "INITIATED",
        contactId: contact?.id,
        workspaceId,
        assistantId,
        metadata: JSON.stringify({ purpose, notes, contactPhone: normalizedPhone, retryCount: 0 }),
      },
    });

    return NextResponse.json({
      success: true,
      callId: result.callId,
      voiceCall,
    });
  } catch (error) {
    console.error("[Voice:Call:POST] Error:", error);
    return NextResponse.json({ error: "Failed to initiate call" }, { status: 500 });
  }
}

/**
 *
 * @param req
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const status = searchParams.get("status");
    const escalated = searchParams.get("escalated");
    const outcome = searchParams.get("outcome");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {
      workspaceId: user.workspaceId,
    };

    if (contactId) {
      where.contactId = contactId;
    }

    if (status) {
      where.status = status;
    }

    if (escalated === "true") {
      where.escalated = true;
    }

    if (escalated === "false") {
      where.escalated = false;
    }

    if (outcome) {
      where.outcome = outcome;
    }

    const [calls, total] = await Promise.all([
      prisma.voiceCall.findMany({
        where,
        include: {
          contact: true,
          consent: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.voiceCall.count({ where }),
    ]);

    return NextResponse.json({
      calls,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + calls.length < total,
      },
    });
  } catch (error) {
    console.error("[Voice:Call:GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 });
  }
}
