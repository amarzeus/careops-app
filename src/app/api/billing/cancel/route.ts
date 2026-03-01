import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelRazorpaySubscription } from "@/lib/razorpay";

/**
 * Handle subscription cancellation via Razorpay
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: user.workspaceId },
    });

    if (!subscription || !subscription.razorpaySubscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    await cancelRazorpaySubscription(subscription.razorpaySubscriptionId);

    const updatedSub = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        // Optional: you could set status to 'cancelled' immediately,
        // but typically you let the webhook catch it at the end of the period.
      },
    });

    return NextResponse.json({ subscription: updatedSub });
  } catch (error) {
    console.error("[Billing Cancel] Error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
