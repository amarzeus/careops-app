import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace");
  if (!workspaceId)
    return NextResponse.json(
      { error: "Workspace ID required" },
      { status: 400 }
    );

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace || workspace.status !== "ACTIVE")
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    );

  const services = await prisma.service.findMany({
    where: { workspaceId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      location: true,
      availableDays: true,
      startTime: true,
      endTime: true,
    },
  });

  return NextResponse.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      address: workspace.address,
    },
    services,
  });
}

