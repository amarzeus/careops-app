import { NextRequest, NextResponse } from "next/server";
import {
  verifyRazorpayWebhookSignature,
  handleRazorpayWebhookEvent,
} from "@/lib/razorpay-subscriptions";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

/**
 *
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!verifyRazorpayWebhookSignature(body, signature, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(body);
    await handleRazorpayWebhookEvent(event);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Razorpay Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
