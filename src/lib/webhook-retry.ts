/**
 * Webhook Retry Queue
 * Manages failed webhook deliveries with exponential backoff
 */

import { prisma } from "./prisma";
import { generateWebhookSignature, serializePayload } from "./webhook-security";

interface WebhookPayload {
  event: string;
  workspaceId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000]; // 1min, 5min, 15min

/**
 * Schedule a webhook for retry
 * @param deliveryLogId - The failed delivery log ID
 * @param attemptNumber - Current attempt number
 */
export async function scheduleWebhookRetry(
  deliveryLogId: string,
  attemptNumber: number
): Promise<void> {
  if (attemptNumber >= MAX_RETRIES) {
    console.log(`[WebhookRetry] Max retries reached for delivery ${deliveryLogId}`);
    
    // Create alert for failed webhook
    const deliveryLog = await prisma.webhookDeliveryLog.findUnique({
      where: { id: deliveryLogId },
      include: { webhook: true }
    });
    
    if (deliveryLog) {
      await prisma.alert.create({
        data: {
          type: "automation",
          title: "Webhook Delivery Failed",
          message: `Webhook to ${deliveryLog.webhook.url} failed after ${MAX_RETRIES} attempts`,
          actionUrl: "/settings/integrations",
          workspaceId: deliveryLog.workspaceId,
        },
      });
    }
    
    return;
  }

  const delay = RETRY_DELAYS[attemptNumber];
  const retryAt = new Date(Date.now() + delay);

  await prisma.webhookDeliveryLog.update({
    where: { id: deliveryLogId },
    data: {
      status: "PENDING_RETRY",
      retryAt,
      retryCount: attemptNumber,
    },
  });

  console.log(`[WebhookRetry] Scheduled retry ${attemptNumber + 1} for ${deliveryLogId} at ${retryAt}`);
}

/**
 * Process pending webhook retries
 * Should be called by the cron job
 */
export async function processWebhookRetries(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();
  
  // Find pending retries that are due
  const pendingRetries = await prisma.webhookDeliveryLog.findMany({
    where: {
      status: "PENDING_RETRY",
      retryAt: { lte: now },
    },
    include: {
      webhook: true,
    },
    take: 50, // Process in batches
  });

  let succeeded = 0;
  let failed = 0;

  for (const deliveryLog of pendingRetries) {
    try {
      // Reconstruct the payload from the stored request body
      const payload: WebhookPayload = JSON.parse(deliveryLog.requestBody || "{}");
      
      const payloadString = serializePayload(payload);
      const signature = deliveryLog.webhook.secret
        ? generateWebhookSignature(payloadString, deliveryLog.webhook.secret)
        : undefined;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": payload.event,
        "X-Webhook-Timestamp": payload.timestamp,
        "X-Webhook-Retry": String(deliveryLog.retryCount + 1),
      };

      if (signature) {
        headers["X-Webhook-Signature"] = signature;
      }

      // Attempt delivery
      const response = await fetch(deliveryLog.webhook.url, {
        method: "POST",
        headers,
        body: payloadString,
      });

      if (response.ok) {
        // Success! Update the log
        await prisma.webhookDeliveryLog.update({
          where: { id: deliveryLog.id },
          data: {
            status: "SUCCESS",
            statusCode: response.status,
            retryAt: null,
          },
        });
        succeeded++;
        console.log(`[WebhookRetry] Successfully delivered to ${deliveryLog.webhook.url}`);
      } else {
        // Failed again, schedule next retry
        await scheduleWebhookRetry(deliveryLog.id, (deliveryLog.retryCount || 0) + 1);
        failed++;
      }
    } catch (error) {
      console.error(`[WebhookRetry] Error processing retry for ${deliveryLog.id}:`, error);
      await scheduleWebhookRetry(deliveryLog.id, (deliveryLog.retryCount || 0) + 1);
      failed++;
    }
  }

  return {
    processed: pendingRetries.length,
    succeeded,
    failed,
  };
}

/**
 * Manually retry a failed webhook delivery
 * @param deliveryLogId - The delivery log ID to retry
 * @param workspaceId - Workspace ID for verification
 */
export async function manualWebhookRetry(
  deliveryLogId: string,
  workspaceId: string
): Promise<{ success: boolean; message: string }> {
  const deliveryLog = await prisma.webhookDeliveryLog.findUnique({
    where: { id: deliveryLogId },
    include: { webhook: true },
  });

  if (!deliveryLog) {
    return { success: false, message: "Delivery log not found" };
  }

  if (deliveryLog.workspaceId !== workspaceId) {
    return { success: false, message: "Unauthorized" };
  }

  if (deliveryLog.status === "SUCCESS") {
    return { success: false, message: "Webhook already delivered successfully" };
  }

  try {
    const payload: WebhookPayload = JSON.parse(deliveryLog.requestBody || "{}");
    const payloadString = serializePayload(payload);
    const signature = deliveryLog.webhook.secret
      ? generateWebhookSignature(payloadString, deliveryLog.webhook.secret)
      : undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": payload.event,
      "X-Webhook-Timestamp": payload.timestamp,
      "X-Webhook-Retry": "manual",
    };

    if (signature) {
      headers["X-Webhook-Signature"] = signature;
    }

    const response = await fetch(deliveryLog.webhook.url, {
      method: "POST",
      headers,
      body: payloadString,
    });

    if (response.ok) {
      await prisma.webhookDeliveryLog.update({
        where: { id: deliveryLog.id },
        data: {
          status: "SUCCESS",
          statusCode: response.status,
          retryAt: null,
        },
      });
      return { success: true, message: "Webhook delivered successfully" };
    } else {
      return { 
        success: false, 
        message: `Delivery failed with status ${response.status}` 
      };
    }
  } catch (error) {
    console.error("[WebhookRetry] Manual retry error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}