import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AutomationTrigger } from "@/lib/automation";
import { generateWebhookSecret } from "@/lib/webhook-security";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER" || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 5, // Include last 5 delivery attempts
      },
    },
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

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" },
      { status: 400 }
    );
  }

  try {
    const webhook = await prisma.webhook.create({
      data: {
        url,
        event: event as AutomationTrigger,
        secret: generateWebhookSecret(), // Auto-generate HMAC secret
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json({
      webhook,
      message: "Webhook created with security signature. Store the secret securely - it will not be shown again."
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
