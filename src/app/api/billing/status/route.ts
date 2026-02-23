import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, getPlanLimits } from "@/lib/razorpay";

/**
 *
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: user.workspaceId },
  });

  const planKey = subscription?.planKey || "free";
  const plan = PLANS[planKey as keyof typeof PLANS];
  const limits = getPlanLimits(planKey as keyof typeof PLANS);

  const usage = await prisma.usageRecord.findMany({
    where: {
      workspaceId: user.workspaceId,
      periodStart: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  const usageMap = usage.reduce(
    (acc, record) => {
      acc[record.category] = record.quantity;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    subscription: {
      id: subscription?.id,
      status: subscription?.status || "active",
      planKey,
      planName: plan?.name || "Starter",
      currentPeriodStart: subscription?.currentPeriodStart,
      currentPeriodEnd: subscription?.currentPeriodEnd,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    },
    limits,
    usage: {
      voiceMinutes: usageMap.voice_minutes || 0,
      smsMessages: usageMap.sms_sent || 0,
      bookings: usageMap.bookings || 0,
      contacts: usageMap.contacts || 0,
    },
  });
}
