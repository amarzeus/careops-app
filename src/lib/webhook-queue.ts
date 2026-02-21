import { prisma } from "@/lib/prisma";

export interface WebhookJobData {
  type: "voice_call_created" | "voice_call_ended" | "voice_call_updated";
  callId: string;
  callSid: string;
  workspaceId: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  retryCount?: number;
  createdAt: Date;
}

export interface WebhookJobResult {
  success: boolean;
  error?: string;
  processedAt: Date;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [5000, 15000, 60000];

export async function enqueueWebhookJob(data: Omit<WebhookJobData, "createdAt">): Promise<string> {
  const job = await prisma.webhookJob.create({
    data: {
      type: data.type,
      callId: data.callId,
      callSid: data.callSid,
      workspaceId: data.workspaceId,
      payload: JSON.stringify(data.payload),
      metadata: JSON.stringify(data.metadata || {}),
      retryCount: data.retryCount || 0,
      status: "pending",
    },
  });

  return job.id;
}

export async function processWebhookJob(jobId: string): Promise<WebhookJobResult> {
  const job = await prisma.webhookJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return { success: false, error: "Job not found", processedAt: new Date() };
  }

  try {
    await prisma.webhookJob.update({
      where: { id: jobId },
      data: { status: "processing", processedAt: new Date() },
    });

    const payload = JSON.parse(job.payload as string) as Record<string, unknown>;
    const metadata = JSON.parse(job.metadata as string) as Record<string, unknown>;

    await processJobByType(job.type, job.callSid, job.workspaceId, payload, metadata);

    await prisma.webhookJob.update({
      where: { id: jobId },
      data: { status: "completed", completedAt: new Date() },
    });

    return { success: true, processedAt: new Date() };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const newRetryCount = job.retryCount + 1;

    if (newRetryCount >= MAX_RETRIES) {
      await prisma.webhookJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          error: errorMessage,
          retryCount: newRetryCount,
          completedAt: new Date(),
        },
      });

      return { success: false, error: errorMessage, processedAt: new Date() };
    }

    const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[newRetryCount - 1] || 60000);

    await prisma.webhookJob.update({
      where: { id: jobId },
      data: {
        status: "retrying",
        error: errorMessage,
        retryCount: newRetryCount,
        nextRetryAt,
      },
    });

    return { success: false, error: errorMessage, processedAt: new Date() };
  }
}

async function processJobByType(
  _type: string,
  _callSid: string,
  _workspaceId: string,
  _payload: Record<string, unknown>,
  _metadata: Record<string, unknown>
): Promise<void> {
  switch (_type) {
    case "voice_call_created":
      await handleVoiceCallCreated(_callSid, _workspaceId, _payload, _metadata);
      break;
    case "voice_call_ended":
      await handleVoiceCallEnded(_callSid, _workspaceId, _payload, _metadata);
      break;
    case "voice_call_updated":
      await handleVoiceCallUpdated(_callSid, _workspaceId, _payload, _metadata);
      break;
    default:
      throw new Error(`Unknown job type: ${_type}`);
  }
}

async function handleVoiceCallCreated(
  callSid: string,
  workspaceId: string,
  _payload: Record<string, unknown>,
  metadata: Record<string, unknown>
): Promise<void> {
  const { afterHours, returningCaller, previousCallSummary } = metadata as {
    afterHours?: boolean;
    returningCaller?: boolean;
    previousCallSummary?: string;
  };

  if (afterHours && workspaceId !== "unknown") {
    await prisma.alert.create({
      data: {
        type: "voice_call",
        title: "After-hours call received",
        message: "A caller reached your voice line outside business hours.",
        actionUrl: `/voice/calls?callSid=${callSid}`,
        workspaceId,
      },
    });
  }

  if (returningCaller && workspaceId !== "unknown") {
    await prisma.alert.create({
      data: {
        type: "voice_call",
        title: "Returning caller detected",
        message: previousCallSummary || "Voice AI matched this caller to a recent conversation.",
        actionUrl: `/voice/calls?callSid=${callSid}`,
        workspaceId,
        isRead: true,
      },
    });
  }
}

async function handleVoiceCallEnded(
  callSid: string,
  workspaceId: string,
  _payload: Record<string, unknown>,
  metadata: Record<string, unknown>
): Promise<void> {
  const { frustrationDetected, duration } = metadata as {
    frustrationDetected?: boolean;
    duration?: number;
  };

  const call = await prisma.voiceCall.findFirst({
    where: { callSid },
    select: { id: true },
  });

  if (!call || workspaceId === "unknown") return;

  await prisma.alert.create({
    data: {
      type: frustrationDetected ? "voice_escalation" : "voice_call",
      title: frustrationDetected ? "Voice escalation needed" : "Voice call completed",
      message: frustrationDetected
        ? "Frustration signals detected. Review this call and follow up with customer."
        : `Call completed. Duration: ${duration || 0}s`,
      actionUrl: `/voice/calls/${call.id}`,
      workspaceId,
    },
  });
}

async function handleVoiceCallUpdated(
  _callSid: string,
  _workspaceId: string,
  _payload: Record<string, unknown>,
  _metadata: Record<string, unknown>
): Promise<void> {
  // Status updates are already handled synchronously
  // This is a placeholder for additional async processing
}

export async function getPendingJobs(limit: number = 10): Promise<WebhookJobData[]> {
  const jobs = await prisma.webhookJob.findMany({
    where: {
      status: { in: ["pending", "retrying"] },
      nextRetryAt: { lte: new Date() },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  return jobs.map((job) => ({
    type: job.type as WebhookJobData["type"],
    callId: job.callId,
    callSid: job.callSid,
    workspaceId: job.workspaceId,
    payload: JSON.parse(job.payload as string) as Record<string, unknown>,
    metadata: JSON.parse(job.metadata as string) as Record<string, unknown>,
    retryCount: job.retryCount,
    createdAt: job.createdAt,
  }));
}
