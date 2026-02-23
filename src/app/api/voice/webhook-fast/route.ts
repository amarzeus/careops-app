import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  normalizeVoicePhoneNumber,
  normalizeVoiceStatus,
  parseVoiceMetadata,
  serializeVoiceMetadata,
} from "@/lib/voice-compliance";
import { processVapiWebhook } from "@/lib/vapi";
import { verifyWebhookSignature } from "@/lib/webhook-security";
import { enqueueWebhookJob } from "@/lib/webhook-queue";

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
async function resolveContactId(
  workspaceId: string,
  contactIdFromMetadata: string | undefined,
  contactPhoneFromMetadata: string | undefined
): Promise<string | null> {
  if (contactIdFromMetadata) return contactIdFromMetadata;
  if (!contactPhoneFromMetadata || workspaceId === "unknown") return null;

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
  const startTime = Date.now();
  const signature = req.headers.get("x-vapi-signature");
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (secret) {
    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }
    const normalizedSignature = signature.replace(/^sha256=/i, "").trim();
    if (!verifyWebhookSignature(rawBody, normalizedSignature, secret)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  }

  let body: VoiceWebhookPayload;
  try {
    body = JSON.parse(rawBody) as VoiceWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { type, call_id, status, duration, recording_url, transcript, summary } = body;

  if (!call_id) {
    return NextResponse.json({ error: "Missing call_id" }, { status: 400 });
  }

  try {
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

    const criticalWrite = await prisma.voiceCall.upsert({
      where: { callSid: call_id },
      create: {
        callSid: call_id,
        direction,
        status: normalizedStatus,
        startedAt: new Date(),
        assistantId: (metadata.assistantId as string | undefined) || null,
        contactId,
        workspaceId,
        metadata: serializeVoiceMetadata(metadata),
      },
      update: {
        status: normalizedStatus,
        ...(processed.action === "end"
          ? {
              endedAt: new Date(),
              duration: duration || null,
              recordingUrl: recording_url || null,
              transcript: transcript || null,
              summary: summary || null,
            }
          : {}),
      },
    });

    const processingTime = Date.now() - startTime;

    if (processed.action === "end" || processed.action === "create") {
      await enqueueWebhookJob({
        type: processed.action === "end" ? "voice_call_ended" : "voice_call_created",
        callId: criticalWrite.id,
        callSid: call_id,
        workspaceId,
        payload: body as Record<string, unknown>,
        metadata: {
          ...metadata,
          contactId,
          direction,
          duration,
          processingTime,
        },
      });
    }

    return NextResponse.json({
      success: true,
      callId: criticalWrite.id,
      processingTime,
    });
  } catch (error) {
    console.error("[VAPI:Webhook:Fast] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/**
 *
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "VAPI webhook endpoint (optimized) is active",
    timestamp: new Date().toISOString(),
  });
}
