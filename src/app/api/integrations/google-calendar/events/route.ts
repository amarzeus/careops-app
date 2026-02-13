import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listCalendarEvents } from "@/lib/google-calendar";

/**
 * GET /api/integrations/google-calendar/events
 * Fetches events from Google Calendar for the dashboard.
 */
export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeMinStr = searchParams.get("timeMin");
    const timeMaxStr = searchParams.get("timeMax");

    if (!timeMinStr || !timeMaxStr) {
        return NextResponse.json(
            { error: "Missing timeMin or timeMax query parameters" },
            { status: 400 }
        );
    }

    try {
        const events = await listCalendarEvents(
            user.workspaceId,
            new Date(timeMinStr),
            new Date(timeMaxStr)
        );

        // Map Google events to a format that can be handled by the UI
        const mappedEvents = events
            .filter((event) => {
                // Filter out events created by CareOps to avoid duplication
                // We identify them by looking for our eventId in the database, 
                // but for now we'll just filter out ones with our unique footer in description
                const description = event.description || "";
                return !description.includes("--- Managed by") && !description.includes("via CareOps ---");
            })
            .map((event) => ({
                id: `google-${event.id}`,
                summary: event.summary,
                description: event.description,
                location: event.location,
                start: event.start.dateTime || event.start.date,
                end: event.end.dateTime || event.end.date,
                isExternal: true,
            }));

        return NextResponse.json({ events: mappedEvents });
    } catch (error) {
        console.error("[API] Google Calendar events fetch error:", error);
        return NextResponse.json({ events: [] });
    }
}
