import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/twilio";
import { isAvailable as isWhatsAppAvailable } from "@/lib/whatsapp";

/**
 *
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isWhatsAppAvailable()) {
    return NextResponse.json(
      {
        error: "WhatsApp is currently disabled.",
        configured: false,
      },
      { status: 500 }
    );
  }

  try {
    const result = await sendWhatsApp(
      user.phone || "+1234567890",
      "Twilio WhatsApp connection verified!"
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "WhatsApp connection verified",
      });
    }

    return NextResponse.json(
      {
        error: `Twilio WhatsApp connection test failed: ${result.error}`,
        configured: true,
      },
      { status: 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json({ error: `WhatsApp connection failed: ${message}` }, { status: 500 });
  }
}
