import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/staff/schedule — Return weekly schedule for a staff member.
 * Query: ?userId=... (owners can query any member, staff sees own only)
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const targetUserId = url.searchParams.get("userId") || user.id;

  // Staff can only view their own schedule
  if (targetUserId !== user.id && user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schedule = await prisma.staffSchedule.findMany({
    where: { userId: targetUserId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ schedule });
}

/**
 * PUT /api/staff/schedule — Upsert weekly schedule for a staff member.
 * Body: { userId?: string, entries: [{ dayOfWeek, startTime, endTime, isAvailable }] }
 */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, entries } = (await req.json()) as {
    userId?: string;
    entries: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  };

  const targetUserId = userId || user.id;

  // Only owners can set schedules for other staff
  if (targetUserId !== user.id && user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the target user belongs to the same workspace
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { workspaceId: true },
  });

  if (!targetUser || targetUser.workspaceId !== user.workspaceId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Validate entries
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "entries array is required" }, { status: 400 });
  }

  // Upsert each entry
  const results = await Promise.all(
    entries.map((entry) =>
      prisma.staffSchedule.upsert({
        where: {
          userId_dayOfWeek: {
            userId: targetUserId,
            dayOfWeek: entry.dayOfWeek,
          },
        },
        update: {
          startTime: entry.startTime,
          endTime: entry.endTime,
          isAvailable: entry.isAvailable,
        },
        create: {
          userId: targetUserId,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          isAvailable: entry.isAvailable,
        },
      })
    )
  );

  return NextResponse.json({ schedule: results });
}
