import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getPlanLimits, type PlanKey } from "./razorpay";

/**
 *
 */
export async function handleRazorpayWebhookEvent(event: {
  event: string;
  payload: {
    subscription?: {
      entity: {
        id: string;
        plan_id: string;
        status: string;
        current_start?: number;
        current_end?: number;
        notes?: Record<string, string>;
      };
    };
    payment?: {
      entity: {
        id: string;
        subscription_id?: string;
        amount: number;
        status: string;
        created_at: number;
      };
    };
  };
}): Promise<void> {
  const { event: eventType, payload } = event;

  switch (eventType) {
    case "subscription.activated": {
      const subscription = payload.subscription?.entity;
      if (subscription?.notes?.workspaceId) {
        await prisma.subscription.upsert({
          where: { workspaceId: subscription.notes.workspaceId },
          create: {
            workspaceId: subscription.notes.workspaceId,
            razorpaySubscriptionId: subscription.id,
            razorpayPlanId: subscription.plan_id,
            planKey: getPlanKeyFromRazorpayPlanId(subscription.plan_id),
            status: "active",
            currentPeriodStart: subscription.current_start
              ? new Date(subscription.current_start * 1000)
              : null,
            currentPeriodEnd: subscription.current_end
              ? new Date(subscription.current_end * 1000)
              : null,
          },
          update: {
            razorpaySubscriptionId: subscription.id,
            razorpayPlanId: subscription.plan_id,
            planKey: getPlanKeyFromRazorpayPlanId(subscription.plan_id),
            status: "active",
            currentPeriodStart: subscription.current_start
              ? new Date(subscription.current_start * 1000)
              : null,
            currentPeriodEnd: subscription.current_end
              ? new Date(subscription.current_end * 1000)
              : null,
          },
        });
      }
      break;
    }

    case "subscription.charged": {
      const payment = payload.payment?.entity;
      const subscription = payload.subscription?.entity;
      if (payment && subscription?.notes?.workspaceId) {
        await prisma.subscription.update({
          where: { workspaceId: subscription.notes.workspaceId },
          data: {
            status: "active",
            lastPaymentAt: new Date(payment.created_at * 1000),
          },
        });
      }
      break;
    }

    case "subscription.cancelled": {
      const subscription = payload.subscription?.entity;
      if (subscription?.notes?.workspaceId) {
        await prisma.subscription.update({
          where: { workspaceId: subscription.notes.workspaceId },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
          },
        });
      }
      break;
    }

    case "subscription.expired": {
      const subscription = payload.subscription?.entity;
      if (subscription?.notes?.workspaceId) {
        await prisma.subscription.update({
          where: { workspaceId: subscription.notes.workspaceId },
          data: {
            status: "expired",
          },
        });
      }
      break;
    }

    case "payment.failed": {
      console.error("[Razorpay Webhook] Payment failed:", event);
      break;
    }
  }
}

/**
 *
 */
export function verifyRazorpayWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expectedSignature === signature;
}

/**
 *
 */
function getPlanKeyFromRazorpayPlanId(planId: string): PlanKey {
  if (planId.toLowerCase().includes("growth")) return "growth";
  if (planId.toLowerCase().includes("pro")) return "pro";
  if (planId.toLowerCase().includes("enterprise")) return "enterprise";
  return "free";
}

export type UsageCategory = "voice_minutes" | "sms_sent" | "emails_sent" | "bookings" | "contacts";

/**
 *
 */
export async function trackUsage(
  workspaceId: string,
  category: UsageCategory,
  quantity: number = 1
): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  await prisma.usageRecord.upsert({
    where: {
      workspaceId_category_periodStart: {
        workspaceId,
        category,
        periodStart,
      },
    },
    create: {
      workspaceId,
      category,
      quantity,
      periodStart,
      periodEnd,
    },
    update: {
      quantity: { increment: quantity },
    },
  });
}

/**
 *
 */
export async function checkUsageLimit(
  workspaceId: string,
  category: UsageCategory
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  const planKey = (subscription?.planKey as PlanKey) || "free";
  const limits = getPlanLimits(planKey);

  const categoryToLimit: Record<UsageCategory, keyof typeof limits> = {
    voice_minutes: "voiceMinutes",
    sms_sent: "smsMessages",
    emails_sent: "smsMessages",
    bookings: "bookings",
    contacts: "contacts",
  };

  const limit = limits[categoryToLimit[category]] as number;

  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1, remaining: -1 };
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const usage = await prisma.usageRecord.findUnique({
    where: {
      workspaceId_category_periodStart: {
        workspaceId,
        category,
        periodStart,
      },
    },
  });

  const used = usage?.quantity || 0;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
  };
}

/**
 *
 */
export async function requireEntitlement(
  workspaceId: string,
  feature: "voice" | "sms" | "bookings" | "contacts"
): Promise<{ allowed: boolean; error?: string }> {
  const categoryMap: Record<string, UsageCategory> = {
    voice: "voice_minutes",
    sms: "sms_sent",
    bookings: "bookings",
    contacts: "contacts",
  };

  const category = categoryMap[feature];
  const { allowed, used, limit } = await checkUsageLimit(workspaceId, category);

  if (!allowed) {
    return {
      allowed: false,
      error: `Usage limit exceeded for ${feature}. Used: ${used}/${limit}. Please upgrade your plan.`,
    };
  }

  return { allowed: true };
}
