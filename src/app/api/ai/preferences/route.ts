import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let prefs = await prisma.aIPreferences.findUnique({
      where: { workspaceId: user.workspaceId },
    });

    if (!prefs) {
      prefs = await prisma.aIPreferences.create({
        data: { workspaceId: user.workspaceId },
      });
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("Error fetching AI preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

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
