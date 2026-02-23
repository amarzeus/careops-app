import { NextResponse } from "next/server";
import { getGoogleAuthURL } from "@/lib/google";

/**
 *
 */
export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google Auth not configured" }, { status: 500 });
  }
  return NextResponse.redirect(getGoogleAuthURL());
}
