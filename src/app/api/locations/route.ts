import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Handle GET /api/locations
 * Returns a list of locations for the authenticated user's workspace
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { workspaceId: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: "User is not assigned to a workspace" }, { status: 400 });
    }

    const locations = await prisma.location.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Handle POST /api/locations
 * Creates a new location within the workspace
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { workspaceId: true, role: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: "User is not assigned to a workspace" }, { status: 400 });
    }

    // Checking if user is OWNER to create a location
    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only workspace owners can add locations" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, address, timezone } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Location name is required" }, { status: 400 });
    }

    const location = await prisma.location.create({
      data: {
        name,
        address: address || null,
        timezone: timezone || "UTC",
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Failed to create location:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
