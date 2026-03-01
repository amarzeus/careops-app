import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayInstance } from "@/lib/razorpay";

/**
 * Fetch billing history and invoices from Razorpay
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: user.workspaceId },
      select: { razorpaySubscriptionId: true, razorpayCustomerId: true },
    });

    if (!subscription || !subscription.razorpaySubscriptionId) {
      return NextResponse.json({ history: [] });
    }

    const razorpay = getRazorpayInstance();
    const invoices = await razorpay.invoices.all({
      subscription_id: subscription.razorpaySubscriptionId,
    });

    const formattedHistory = invoices.items.map(
      (inv: {
        id?: string;
        amount?: number | string | null;
        status?: string | null;
        issued_at?: number | null;
        short_url?: string | null;
      }) => ({
        id: inv.id || "unknown",
        amount: Number(inv.amount || 0) / 100, // Convert from paise to INR
        status: inv.status || "unknown",
        date: inv.issued_at
          ? new Date(inv.issued_at * 1000).toISOString()
          : new Date().toISOString(),
        invoiceUrl: inv.short_url || "",
      })
    );

    return NextResponse.json({ history: formattedHistory });
  } catch (error) {
    console.error("[Billing History] Error:", error);
    return NextResponse.json({ error: "Failed to fetch billing history" }, { status: 500 });
  }
}
