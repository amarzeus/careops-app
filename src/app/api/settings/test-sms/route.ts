import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isConfigured, sendSMS } from "@/lib/twilio";

/**
 *
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Twilio not configured" },
      { status: 500 }
    );
  }

  try {
    if (!user.phone) {
      return NextResponse.json(
        { error: "Please set your phone number in your Profile settings first." },
        { status: 400 }
      );
    }

    const result = await sendSMS(user.phone, "Twilio SMS connection verified!");

    if (!result.success) {
      return NextResponse.json(
        { error: `Twilio delivery failed: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "SMS connection verified" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json(
      { error: `SMS connection failed: ${message}` },
      { status: 500 }
    );
  }
}
