/* eslint-disable @typescript-eslint/no-explicit-any */
import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const getRazorpayInstance = (): Razorpay => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
};

export const PLANS = {
  free: {
    name: "Starter",
    price: 0,
    period: "monthly",
    limits: {
      voiceMinutes: 0,
      smsMessages: 50,
      bookings: 50,
      contacts: 100,
      phoneNumbers: 0,
      staff: 1,
    },
    features: ["Dashboard", "Basic Messaging", "Contact Forms"],
  },
  growth: {
    name: "Growth",
    price: 1999,
    period: "monthly",
    limits: {
      voiceMinutes: 200,
      smsMessages: 500,
      bookings: 500,
      contacts: 1000,
      phoneNumbers: 1,
      staff: 3,
    },
    features: ["Everything in Starter", "1 Phone Number", "Voice AI", "Email Support"],
  },
  pro: {
    name: "Professional",
    price: 4999,
    period: "monthly",
    limits: {
      voiceMinutes: 1000,
      smsMessages: 2000,
      bookings: 2000,
      contacts: 5000,
      phoneNumbers: 3,
      staff: 10,
    },
    features: ["Everything in Growth", "3 Phone Numbers", "Priority Support", "Analytics"],
  },
  enterprise: {
    name: "Enterprise",
    price: 14999,
    period: "monthly",
    limits: {
      voiceMinutes: -1,
      smsMessages: -1,
      bookings: -1,
      contacts: -1,
      phoneNumbers: -1,
      staff: -1,
    },
    features: [
      "Everything in Pro",
      "Unlimited Numbers",
      "SLA",
      "Dedicated Support",
      "Custom Integrations",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 *
 */
export async function createRazorpayPlan(planKey: PlanKey): Promise<{ id: string }> {
  const razorpay = getRazorpayInstance();
  const plan = PLANS[planKey];

  if (plan.price === 0) {
    return { id: `free_${planKey}` };
  }

  const razorpayPlan = await razorpay.plans.create({
    period: plan.period as "daily" | "weekly" | "monthly" | "yearly",
    interval: 1,
    item: {
      name: plan.name,
      amount: plan.price * 100,
      currency: "INR",
      description: `CareOps ${plan.name} Plan`,
    },
  });

  return { id: razorpayPlan.id };
}

/**
 *
 */
export async function createRazorpaySubscription(params: {
  planId: string;
  workspaceId: string;
  customerEmail: string;
  customerName: string;
}): Promise<{ subscriptionId: string; razorpayOrderId: string }> {
  const razorpay = getRazorpayInstance();

  // 1. Resolve Plan ID (if planKey was passed instead of a real ID)
  let realPlanId = params.planId;
  let planKey: PlanKey =
    (params.planId as any) === "free" ? "free" : getPlanKeyFromPlanId(params.planId);

  if (params.planId === "growth" || params.planId === "pro" || params.planId === "enterprise") {
    planKey = params.planId as PlanKey;
    const { id } = await createRazorpayPlan(planKey);
    realPlanId = id;
  }

  // 2. Handle Customer
  const customer = await prisma.subscription.findUnique({
    where: { workspaceId: params.workspaceId },
    select: { razorpayCustomerId: true },
  });

  let customerId = customer?.razorpayCustomerId;

  if (!customerId) {
    try {
      const razorpayCustomer = await razorpay.customers.create({
        name: params.customerName,
        email: params.customerEmail,
        notes: { workspaceId: params.workspaceId },
      });
      customerId = (razorpayCustomer as any as { id: string }).id;
    } catch (error: any) {
      // If customer already exists, fetch them
      if (error.error?.description === "Customer already exists for the merchant") {
        const customers = await razorpay.customers.all({
          email: params.customerEmail,
        } as any);
        if (customers.items && customers.items.length > 0) {
          customerId = customers.items[0].id;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  // 3. Create Subscription

  const subscriptionsApi = razorpay.subscriptions as any;
  const subscription = await subscriptionsApi.create({
    plan_id: realPlanId,
    customer_id: customerId,
    total_count: 12,
    quantity: 1,
    customer_notify: 1,
    notes: { workspaceId: params.workspaceId },
  });
  const subscriptionId = subscription?.id as string;

  // 4. Update Database
  await prisma.subscription.upsert({
    where: { workspaceId: params.workspaceId },
    create: {
      workspaceId: params.workspaceId,
      razorpaySubscriptionId: subscriptionId,
      razorpayPlanId: realPlanId,
      razorpayCustomerId: customerId,
      status: "pending",
    },
    update: {
      razorpaySubscriptionId: subscriptionId,
      razorpayPlanId: realPlanId,
      razorpayCustomerId: customerId,
      status: "pending",
    },
  });

  return {
    subscriptionId,
    razorpayOrderId: subscriptionId,
  };
}

/**
 *
 */
export async function cancelRazorpaySubscription(subscriptionId: string): Promise<void> {
  const razorpay = getRazorpayInstance();
  await razorpay.subscriptions.cancel(subscriptionId, true);
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
export function getPlanKeyFromPlanId(planId: string): PlanKey {
  if (planId.includes("growth") || planId === PLANS.growth.name.toLowerCase()) return "growth";
  if (planId.includes("pro") || planId === PLANS.pro.name.toLowerCase()) return "pro";
  if (planId.includes("enterprise") || planId === PLANS.enterprise.name.toLowerCase())
    return "enterprise";
  return "free";
}

/**
 *
 */
export function getPlanLimits(planKey: PlanKey) {
  return PLANS[planKey]?.limits || PLANS.free.limits;
}

export { getRazorpayInstance };
