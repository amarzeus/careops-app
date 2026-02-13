import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AutomationTrigger } from "@prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER" || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ webhooks });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER" || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { url, event } = await req.json();
  if (!url || !event) {
    return NextResponse.json(
      { error: "Missing URL or Event trigger" },
      { status: 400 }
    );
  }

  try {
    const webhook = await prisma.webhook.create({
      data: {
        url,
        event: event as AutomationTrigger,
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
