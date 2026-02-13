import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    return NextResponse.json(
      { error: "MSG91_AUTH_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // Verify MSG91 API key by checking balance/status
    const res = await fetch("https://control.msg91.com/api/v5/balance?type=1", {
      headers: { authkey: authKey },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "MSG91 API key validation failed" },
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
