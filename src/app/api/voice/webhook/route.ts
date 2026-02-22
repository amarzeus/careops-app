import { subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  detectFrustration,
  extractConsentDecision,
  isAfterHours,
  normalizeVoicePhoneNumber,
  normalizeVoiceStatus,
  parseVoiceMetadata,
  serializeVoiceMetadata,
} from "@/lib/voice-compliance";
import { processVapiWebhook } from "@/lib/vapi";
import { verifyWebhookSignature } from "@/lib/webhook-security";

interface VoiceWebhookPayload {
  type?: string;
  call_id?: string;
  status?: string;
  duration?: number;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  metadata?: unknown;
  direction?: string;
}

/**
 *
 */
function parseRetryCount(metadata: Record<string, unknown>): number {
  const raw = metadata.retryCount;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(0, Math.floor(raw));
  }

  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}

/**
 *
 */
async function resolveContactId(
  workspaceId: string,
  contactIdFromMetadata: string | undefined,
  contactPhoneFromMetadata: string | undefined
): Promise<string | null> {
  if (contactIdFromMetadata) {
    return contactIdFromMetadata;
  }

  if (!contactPhoneFromMetadata || workspaceId === "unknown") {
    return null;
  }

  const normalizedPhone = normalizeVoicePhoneNumber(contactPhoneFromMetadata);
  const contact = await prisma.contact.findFirst({
    where: {
      workspaceId,
      OR: [{ phone: contactPhoneFromMetadata }, { phone: normalizedPhone }],
    },
    select: { id: true },
  });

  return contact?.id || null;
}

/**
 *
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-vapi-signature");
  const secret = process.env.VAPI_WEBHOOK_SECRET;

  const rawBody = await req.text();

  if (secret) {
    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }

    const normalizedSignature = signature.replace(/^sha256=/i, "").trim();
    const isValid = verifyWebhookSignature(rawBody, normalizedSignature, secret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  }

  let body: VoiceWebhookPayload;

  try {
    body = JSON.parse(rawBody) as VoiceWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const { type, call_id, status, duration, recording_url, transcript, summary } = body;

    if (!call_id) {
      return NextResponse.json({ error: "Missing call_id" }, { status: 400 });
    }

    const metadata = parseVoiceMetadata(body.metadata);
    const workspaceId = (metadata.workspaceId as string | undefined) || "unknown";
    const contactPhone = metadata.contactPhone as string | undefined;
    const contactId = await resolveContactId(
      workspaceId,
      metadata.contactId as string | undefined,
      contactPhone
    );

    const processed = processVapiWebhook({
      type: type || "",
      call_id,
      status: status as
        | "queued"
        | "ringing"
        | "in-progress"
        | "completed"
        | "failed"
        | "no-answer"
        | "busy"
        | "cancelled"
        | undefined,
      duration,
      transcript,
      metadata,
    });

    const normalizedStatus = normalizeVoiceStatus(processed.status || status);
    const direction =
      typeof body.direction === "string"
        ? normalizeVoiceStatus(body.direction)
        : contactPhone
          ? "OUTBOUND"
          : "INBOUND";

    if (processed.action === "create") {
      const workspace =
        workspaceId !== "unknown"
          ? await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { timezone: true },
          })
          : null;

      const afterHours =
        direction === "INBOUND" ? isAfterHours(workspace?.timezone || null) : false;

      const previousCall =
        workspaceId !== "unknown" && contactId
          ? await prisma.voiceCall.findFirst({
            where: {
              workspaceId,
              contactId,
              createdAt: { gte: subDays(new Date(), 7) },
              callSid: { not: call_id },
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, summary: true },
          })
          : null;

      const mergedMetadata = {
        ...metadata,
        retryCount: parseRetryCount(metadata),
        afterHours,
        returningCaller: !!previousCall,
        previousCallId: previousCall?.id,
        previousCallSummary: previousCall?.summary,
      };

      const voiceCall = await prisma.voiceCall.upsert({
        where: { callSid: call_id },
        create: {
          callSid: call_id,
          direction,
          status: normalizedStatus,
          startedAt: new Date(),
          assistantId: (metadata.assistantId as string | undefined) || null,
          contactId,
          workspaceId,
          summary: previousCall?.summary || null,
          metadata: serializeVoiceMetadata(mergedMetadata),
        },
        update: {
          status: normalizedStatus,
          startedAt: new Date(),
          contactId,
          metadata: serializeVoiceMetadata(mergedMetadata),
        },
      });

      if (afterHours && workspaceId !== "unknown") {
        await prisma.alert.create({
          data: {
            type: "voice_call",
            title: "After-hours call received",
            message: "A caller reached your voice line outside business hours.",
            actionUrl: `/voice/calls/${voiceCall.id}`,
            workspaceId,
          },
        });
      }

      if (previousCall && workspaceId !== "unknown") {
        await prisma.alert.create({
          data: {
            type: "voice_call",
            title: "Returning caller detected",
            message: "CareOps AI matched this caller to a recent conversation.",
            actionUrl: `/voice/calls/${voiceCall.id}`,
            workspaceId,
            isRead: true,
          },
        });
      }
    }

    if (processed.action === "update") {
      await prisma.voiceCall.updateMany({
        where: { callSid: call_id },
        data: {
          status: normalizedStatus,
          ...(summary ? { summary } : {}),
        },
      });
    }

    if (processed.action === "end") {
      const existing = await prisma.voiceCall.findFirst({
        where: { callSid: call_id },
        select: { id: true, metadata: true, workspaceId: true, direction: true },
      });
      const alertWorkspaceId = workspaceId !== "unknown" ? workspaceId : existing?.workspaceId || "unknown";

      const existingMetadata = parseVoiceMetadata(existing?.metadata || {});
      const mergedMetadata: Record<string, unknown> = {
        ...existingMetadata,
        ...metadata,
      };

      const retryCount = parseRetryCount(mergedMetadata);

      if (
        (normalizedStatus === "NO_ANSWER" || normalizedStatus === "BUSY") &&
        (existing?.direction || direction) === "OUTBOUND"
      ) {
        if (retryCount < 2) {
          mergedMetadata.retryCount = retryCount;
          mergedMetadata.nextRetryAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
        } else {
          mergedMetadata.retryCount = retryCount;
          mergedMetadata.smsFallbackRequired = true;
        }
      }

      const consentDecision = extractConsentDecision(body as Record<string, unknown>, mergedMetadata);
      const frustrationDetected = detectFrustration(transcript);

      await prisma.voiceCall.updateMany({
        where: { callSid: call_id },
        data: {
          status: normalizedStatus,
          endedAt: new Date(),
          duration: duration || null,
          recordingUrl: consentDecision.provided && !consentDecision.granted ? null : recording_url || null,
          transcript: transcript || null,
          ...(summary ? { summary } : {}),
          escalated: frustrationDetected,
          escalationReason: frustrationDetected ? "frustration" : null,
          metadata: serializeVoiceMetadata(mergedMetadata),
          outcome:
            normalizedStatus === "NO_ANSWER"
              ? "NO_ANSWER"
              : normalizedStatus === "BUSY"
                ? "BUSY"
                : normalizedStatus,
        },
      });

      const callForConsent = await prisma.voiceCall.findFirst({
        where: { callSid: call_id },
        select: { id: true, workspaceId: true },
      });

      if (callForConsent && consentDecision.provided) {
        await prisma.callConsent.upsert({
          where: { voiceCallId: callForConsent.id },
          create: {
            voiceCallId: callForConsent.id,
            consentText: consentDecision.text,
            consentResponse: consentDecision.granted,
            notes: `Raw response: ${consentDecision.raw}`,
          },
          update: {
            consentText: consentDecision.text,
            consentResponse: consentDecision.granted,
            capturedAt: new Date(),
            notes: `Raw response: ${consentDecision.raw}`,
          },
        });
      }

      if (transcript && alertWorkspaceId !== "unknown") {
        await prisma.alert.create({
          data: {
            type: frustrationDetected ? "voice_escalation" : "voice_call",
            title: frustrationDetected ? "Voice escalation needed" : "Voice call completed",
            message: frustrationDetected
              ? "Frustration signals detected. Review this call and follow up with customer."
              : `Call completed. Duration: ${duration || 0}s`,
            actionUrl: existing?.id ? `/voice/calls/${existing.id}` : "/voice/calls",
            workspaceId: alertWorkspaceId,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VAPI:Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/**
 *
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "VAPI webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
