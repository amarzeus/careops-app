import { prisma } from "./prisma";

// ──── Types ────

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string; displayName?: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  status?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface CalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
}

// ──── Constants ────

const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// ──── OAuth Flow ────

/**
 * Generate the Google Calendar OAuth URL.
 * We use a separate redirect URI from the auth callback so they don't conflict.
 * @param workspaceId
 */
export function getCalendarAuthURL(workspaceId: string): string {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: workspaceId, // Pass workspaceId to link on callback
  });

  return `${rootUrl}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 * @param code
 */
export async function exchangeCalendarCode(code: string): Promise<GoogleTokenResponse> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("[Google Calendar] Token exchange failed:", error);
    throw new Error("Failed to exchange Google Calendar authorization code");
  }

  return res.json();
}

/**
 * Refresh an expired access token using the refresh token.
 * @param refreshToken
 */
async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("[Google Calendar] Token refresh failed:", error);
    throw new Error("Failed to refresh Google Calendar token");
  }

  return res.json();
}

// ──── Token Management ────

/**
 * Get a valid access token for a workspace, refreshing if expired.
 * Returns null if calendar is not connected.
 * @param workspaceId
 */
export async function getValidAccessToken(workspaceId: string): Promise<string | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      googleCalendarConnected: true,
      googleCalendarAccessToken: true,
      googleCalendarRefreshToken: true,
      googleCalendarTokenExpiry: true,
    },
  });

  if (
    !workspace?.googleCalendarConnected ||
    !workspace.googleCalendarAccessToken ||
    !workspace.googleCalendarRefreshToken
  ) {
    return null;
  }

  // Check if token is expired (with 5-minute buffer)
  const now = new Date();
  const expiry = workspace.googleCalendarTokenExpiry
    ? new Date(workspace.googleCalendarTokenExpiry)
    : new Date(0);
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (now.getTime() + bufferMs >= expiry.getTime()) {
    // Token expired or about to expire — refresh it
    try {
      const tokens = await refreshAccessToken(workspace.googleCalendarRefreshToken);

      const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          googleCalendarAccessToken: tokens.access_token,
          googleCalendarTokenExpiry: newExpiry,
          ...(tokens.refresh_token && {
            googleCalendarRefreshToken: tokens.refresh_token,
          }),
        },
      });

      return tokens.access_token;
    } catch (error) {
      console.error("[Google Calendar] Token refresh error:", error);
      // Mark as disconnected on persistent refresh failure
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { googleCalendarConnected: false },
      });
      return null;
    }
  }

  return workspace.googleCalendarAccessToken;
}

// ──── Calendar API Helpers ────

/**
 * Make an authenticated request to the Google Calendar API.
 * @param accessToken
 * @param path
 * @param options
 */
async function calendarFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return res;
}

/**
 * Get the authenticated user's email from the calendar API.
 * @param accessToken
 */
export async function getCalendarUserEmail(accessToken: string): Promise<string | null> {
  const res = await calendarFetch(accessToken, "/calendars/primary");
  if (!res.ok) return null;
  const data = await res.json();
  return data.id || null; // The primary calendar ID is typically the user's email
}

/**
 * List the user's calendars.
 * @param accessToken
 */
export async function listCalendars(accessToken: string): Promise<CalendarListEntry[]> {
  const res = await calendarFetch(accessToken, "/users/me/calendarList");
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

/**
 * List events from a calendar for a specific time range.
 * @param workspaceId
 * @param timeMin
 * @param timeMax
 */
export async function listCalendarEvents(
  workspaceId: string,
  timeMin: Date,
  timeMax: Date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const accessToken = await getValidAccessToken(workspaceId);
  if (!accessToken) return [];

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { googleCalendarId: true },
  });

  const calendarId = workspace?.googleCalendarId || "primary";

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  try {
    const res = await calendarFetch(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Google Calendar] List events failed:", errorText);
      return [];
    }

    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("[Google Calendar] List events error:", error);
    return [];
  }
}

// ──── CRUD Operations ────

/**
 * Create a Google Calendar event for a booking.
 * Returns the created event ID or null on failure.
 * @param workspaceId
 * @param event
 * @param event.summary
 * @param event.description
 * @param event.location
 * @param event.startTime
 * @param event.endTime
 * @param event.timezone
 * @param event.attendeeEmail
 * @param event.attendeeName
 */
export async function createCalendarEvent(
  workspaceId: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    attendeeEmail?: string;
    attendeeName?: string;
  }
): Promise<string | null> {
  const accessToken = await getValidAccessToken(workspaceId);
  if (!accessToken) return null;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { googleCalendarId: true, name: true },
  });

  const calendarId = workspace?.googleCalendarId || "primary";

  const calendarEvent: GoogleCalendarEvent = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: event.timezone,
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: event.timezone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "email", minutes: 60 },
      ],
    },
  };

  // Add attendee if email is provided
  if (event.attendeeEmail) {
    calendarEvent.attendees = [
      {
        email: event.attendeeEmail,
        displayName: event.attendeeName,
      },
    ];
  }

  try {
    const res = await calendarFetch(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        body: JSON.stringify(calendarEvent),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Google Calendar] Create event failed:", errorText);
      return null;
    }

    const data = await res.json();
    console.log(`[Google Calendar] Event created: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error("[Google Calendar] Create event error:", error);
    return null;
  }
}

/**
 * Update an existing Google Calendar event.
 * @param workspaceId
 * @param eventId
 * @param updates
 * @param updates.summary
 * @param updates.description
 * @param updates.location
 * @param updates.startTime
 * @param updates.endTime
 * @param updates.timezone
 * @param updates.status
 */
export async function updateCalendarEvent(
  workspaceId: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    location?: string;
    startTime?: Date;
    endTime?: Date;
    timezone?: string;
    status?: string;
  }
): Promise<boolean> {
  const accessToken = await getValidAccessToken(workspaceId);
  if (!accessToken) return false;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { googleCalendarId: true },
  });

  const calendarId = workspace?.googleCalendarId || "primary";

  const eventUpdate: Partial<GoogleCalendarEvent> = {};

  if (updates.summary) eventUpdate.summary = updates.summary;
  if (updates.description) eventUpdate.description = updates.description;
  if (updates.location) eventUpdate.location = updates.location;
  if (updates.status) eventUpdate.status = updates.status;
  if (updates.startTime && updates.timezone) {
    eventUpdate.start = {
      dateTime: updates.startTime.toISOString(),
      timeZone: updates.timezone,
    };
  }
  if (updates.endTime && updates.timezone) {
    eventUpdate.end = {
      dateTime: updates.endTime.toISOString(),
      timeZone: updates.timezone,
    };
  }

  try {
    const res = await calendarFetch(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(eventUpdate),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Google Calendar] Update event failed:", errorText);
      return false;
    }

    console.log(`[Google Calendar] Event updated: ${eventId}`);
    return true;
  } catch (error) {
    console.error("[Google Calendar] Update event error:", error);
    return false;
  }
}

/**
 * Cancel (delete) a Google Calendar event.
 * @param workspaceId
 * @param eventId
 */
export async function cancelCalendarEvent(workspaceId: string, eventId: string): Promise<boolean> {
  const accessToken = await getValidAccessToken(workspaceId);
  if (!accessToken) return false;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { googleCalendarId: true },
  });

  const calendarId = workspace?.googleCalendarId || "primary";

  try {
    const res = await calendarFetch(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE" }
    );

    if (!res.ok && res.status !== 410) {
      // 410 = already deleted, which is fine
      const errorText = await res.text();
      console.error("[Google Calendar] Delete event failed:", errorText);
      return false;
    }

    console.log(`[Google Calendar] Event cancelled: ${eventId}`);
    return true;
  } catch (error) {
    console.error("[Google Calendar] Delete event error:", error);
    return false;
  }
}

// ──── High-Level Booking Sync ────

/**
 * Sync a booking to Google Calendar.
 * Creates an event and stores the eventId on the booking.
 * Fails gracefully — never breaks the booking flow.
 * @param bookingId
 * @param workspaceId
 */
export async function syncBookingToCalendar(bookingId: string, workspaceId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        contact: true,
        workspace: {
          select: {
            name: true,
            timezone: true,
            googleCalendarConnected: true,
          },
        },
      },
    });

    if (!booking || !booking.workspace.googleCalendarConnected) return;

    const eventId = await createCalendarEvent(workspaceId, {
      summary: `${booking.service.name} - ${booking.contact.name}`,
      description: [
        `Service: ${booking.service.name}`,
        `Client: ${booking.contact.name}`,
        booking.contact.email ? `Email: ${booking.contact.email}` : "",
        booking.contact.phone ? `Phone: ${booking.contact.phone}` : "",
        booking.notes ? `Notes: ${booking.notes}` : "",
        `\n--- Managed by ${booking.workspace.name} via CareOps ---`,
      ]
        .filter(Boolean)
        .join("\n"),
      location: booking.service.location || undefined,
      startTime: booking.date,
      endTime: booking.endTime,
      timezone: booking.workspace.timezone,
      attendeeEmail: booking.contact.email || undefined,
      attendeeName: booking.contact.name,
    });

    if (eventId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { googleCalendarEventId: eventId },
      });
    }
  } catch (error) {
    // Never let calendar sync break the booking flow
    console.error("[Google Calendar] Sync booking error:", error);
  }
}

/**
 * Update a booking's calendar event when the booking changes.
 * @param bookingId
 * @param workspaceId
 */
export async function updateBookingCalendarEvent(
  bookingId: string,
  workspaceId: string
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        contact: true,
        workspace: {
          select: {
            timezone: true,
            googleCalendarConnected: true,
          },
        },
      },
    });

    if (!booking || !booking.googleCalendarEventId || !booking.workspace.googleCalendarConnected) {
      return;
    }

    await updateCalendarEvent(workspaceId, booking.googleCalendarEventId, {
      summary: `${booking.service.name} - ${booking.contact.name}`,
      startTime: booking.date,
      endTime: booking.endTime,
      timezone: booking.workspace.timezone,
      location: booking.service.location || undefined,
    });
  } catch (error) {
    console.error("[Google Calendar] Update booking event error:", error);
  }
}

/**
 * Cancel a booking's calendar event.
 * @param bookingId
 * @param workspaceId
 */
export async function cancelBookingCalendarEvent(
  bookingId: string,
  workspaceId: string
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        googleCalendarEventId: true,
        workspace: {
          select: { googleCalendarConnected: true },
        },
      },
    });

    if (!booking?.googleCalendarEventId || !booking.workspace.googleCalendarConnected) {
      return;
    }

    await cancelCalendarEvent(workspaceId, booking.googleCalendarEventId);

    // Clear the event ID reference
    await prisma.booking.update({
      where: { id: bookingId },
      data: { googleCalendarEventId: null },
    });
  } catch (error) {
    console.error("[Google Calendar] Cancel booking event error:", error);
  }
}

/**
 * Check if Google Calendar is connected for a workspace.
 * @param workspaceId
 */
export async function isCalendarConnected(workspaceId: string): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { googleCalendarConnected: true },
  });
  return workspace?.googleCalendarConnected ?? false;
}
