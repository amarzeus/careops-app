import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRazorpaySubscription, PLANS, type PlanKey } from "@/lib/razorpay";

/**
 *
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planKey } = (await req.json()) as { planKey: PlanKey };

  if (!planKey || !PLANS[planKey]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = PLANS[planKey];

  if (plan.price === 0) {
    await prisma.subscription.upsert({
      where: { workspaceId: user.workspaceId },
      create: {
        workspaceId: user.workspaceId,
        planKey: "free",
        status: "active",
      },
      update: {
        planKey: "free",
        status: "active",
      },
    });

    return NextResponse.json({ planKey: "free", amount: 0 });
  }

  try {
    const { subscriptionId, razorpayOrderId } = await createRazorpaySubscription({
      planId: planKey,
      workspaceId: user.workspaceId,
      customerEmail: user.email,
      customerName: user.name,
    });

    return NextResponse.json({
      subscriptionId,
      razorpayOrderId,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: plan.price,
      currency: "INR",
      prefill: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[Billing Checkout] Error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
