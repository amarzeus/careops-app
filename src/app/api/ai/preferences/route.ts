/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 *
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Fetching AI preferences for workspace:", user.workspaceId);
    let prefs = await (prisma as any).aIPreferences.findUnique({
      where: { workspaceId: user.workspaceId },
    });

    if (!prefs) {
      console.log("No AI preferences found, creating default...");
      prefs = await (prisma as any).aIPreferences.create({
        data: { workspaceId: user.workspaceId },
      });
      console.log("Created AI preferences:", prefs);
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("Error fetching AI preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

/**
 *
 * @param req
 */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const prefs = await prisma.aIPreferences.upsert({
      where: { workspaceId: user.workspaceId },
      update: body,
      create: { workspaceId: user.workspaceId, ...body },
    });

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("Error updating AI preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
