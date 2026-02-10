import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
