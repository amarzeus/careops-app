import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCalendarAuthURL } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/integrations/google-calendar
 * Returns the calendar connection status for the current workspace.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
    select: {
      googleCalendarConnected: true,
      googleCalendarEmail: true,
      googleCalendarId: true,
    },
  });

  return NextResponse.json({
    connected: workspace?.googleCalendarConnected ?? false,
    email: workspace?.googleCalendarEmail ?? null,
    calendarId: workspace?.googleCalendarId ?? "primary",
  });
}

/**
 * POST /api/integrations/google-calendar
 * Initiates the OAuth flow — returns the auth URL to redirect the user to.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owners can manage integrations
  if (user.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only workspace owners can manage integrations" },
      { status: 403 }
    );
  }

  const authUrl = getCalendarAuthURL(user.workspaceId);
  return NextResponse.json({ url: authUrl });
}

/**
 * DELETE /api/integrations/google-calendar
 * Disconnects Google Calendar from the workspace.
 */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only workspace owners can manage integrations" },
      { status: 403 }
    );
  }

  await prisma.workspace.update({
    where: { id: user.workspaceId },
    data: {
      googleCalendarConnected: false,
      googleCalendarAccessToken: null,
      googleCalendarRefreshToken: null,
      googleCalendarTokenExpiry: null,
      googleCalendarEmail: null,
      googleCalendarId: "primary",
    },
  });

  return NextResponse.json({ success: true });
}
