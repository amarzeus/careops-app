import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCalendarCode,
  getCalendarUserEmail,
} from "@/lib/google-calendar";

/**
 * GET /api/integrations/google-calendar/callback
 * Handles the Google OAuth callback after the user grants calendar access.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // workspaceId
  const error = searchParams.get("error");

  // Handle user denial
  if (error) {
    console.error("[Google Calendar] OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&calendar=denied", req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&calendar=error", req.url)
    );
  }

  try {
    // Verify the workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: state },
    });

    if (!workspace) {
      console.error("[Google Calendar] Invalid workspace in state:", state);
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&calendar=error", req.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCalendarCode(code);
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Get the user's calendar email
    const calendarEmail = await getCalendarUserEmail(tokens.access_token);

    // Save tokens to workspace
    await prisma.workspace.update({
      where: { id: state },
      data: {
        googleCalendarConnected: true,
        googleCalendarAccessToken: tokens.access_token,
        googleCalendarRefreshToken:
          tokens.refresh_token || workspace.googleCalendarRefreshToken,
        googleCalendarTokenExpiry: tokenExpiry,
        googleCalendarEmail: calendarEmail,
        googleCalendarId: "primary",
      },
    });

    console.log(
      `[Google Calendar] Connected for workspace ${state} (${calendarEmail})`
    );

    return NextResponse.redirect(
      new URL("/settings?tab=integrations&calendar=success", req.url)
    );
  } catch (err) {
    console.error("[Google Calendar] Callback error:", err);
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&calendar=error", req.url)
    );
  }
}
