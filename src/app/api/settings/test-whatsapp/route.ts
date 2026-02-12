import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkHealth, isWhatsAppConfigured } from "@/lib/msg91";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      {
        error: "WhatsApp is not configured. Set MSG91_AUTH_KEY and MSG91_WHATSAPP_INTEGRATED_NUMBER in your environment.",
        configured: false,
      },
      { status: 500 }
    );
  }

  try {
    const health = await checkHealth();

    if (health.whatsapp.healthy) {
      return NextResponse.json({
        success: true,
        message: "WhatsApp connection verified",
        balance: health.whatsapp.balance,
      });
    }

    return NextResponse.json(
      {
        error: "WhatsApp API connection test failed. Check your MSG91 dashboard for WhatsApp configuration.",
        configured: true,
      },
      { status: 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json(
      { error: `WhatsApp connection failed: ${message}` },
      { status: 500 }
    );
  }
}
