import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 *
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.service.findMany({
    where: { workspaceId: user.workspaceId },
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ services });
}

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, duration, location, availableDays, startTime, endTime } =
    await req.json();
  if (!name || !duration)
    return NextResponse.json(
      { error: "Name and duration are required" },
      { status: 400 }
    );

  const service = await prisma.service.create({
    data: {
      name,
      description,
      duration: parseInt(duration),
      location,
      availableDays: availableDays || "1,2,3,4,5",
      startTime: startTime || "09:00",
      endTime: endTime || "17:00",
      workspaceId: user.workspaceId,
    },
  });

  return NextResponse.json({ service }, { status: 201 });
}

/**
 *
 * @param req
 */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, description, duration, location, availableDays, startTime, endTime } = await req.json();
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  // Verify ownership
  const existingService = await prisma.service.findFirst({
    where: { id, workspaceId: user.workspaceId },
  });
  if (!existingService) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const service = await prisma.service.update({
    where: { id },
    data: {
      name,
      description,
      duration: duration ? parseInt(String(duration)) : undefined,
      location,
      availableDays,
      startTime,
      endTime,
    },
  });

  return NextResponse.json({ service });
}
