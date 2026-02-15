import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumeAutomation } from "@/lib/automation";

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id, workspaceId: user.workspaceId },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true } } },
      },
    },
  });

  if (!conversation)
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );

  // Mark as read
  await prisma.conversation.update({
    where: { id },
    data: { unreadCount: 0 },
  });

  return NextResponse.json({ conversation });
}

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  if (action === "resume") {
    await resumeAutomation(id, user.workspaceId);
    return NextResponse.json({ success: true, message: "Automation resumed" });
  }

  if (action === "pause") {
    await prisma.conversation.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true, message: "Automation paused" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content, channel } = await req.json();
  if (!content)
    return NextResponse.json(
      { error: "Message content is required" },
      { status: 400 }
    );

  const message = await prisma.message.create({
    data: {
      content,
      channel: channel || "EMAIL",
      direction: "OUTBOUND",
      isAutomated: false,
      conversationId: id,
      senderId: user.id,
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({ message }, { status: 201 });
}
