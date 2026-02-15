import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerAutomation } from "@/lib/automation";

/**
 *
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await prisma.contact.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      _count: { select: { bookings: true } },
      conversation: {
        select: { id: true, unreadCount: true, lastMessageAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contacts });
}

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, phone, source, notes } = await req.json();
  if (!name)
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const contact = await prisma.contact.create({
    data: {
      name,
      email,
      phone,
      source: source || "manual",
      notes,
      workspaceId: user.workspaceId,
    },
  });

  // Create conversation
  await prisma.conversation.create({
    data: {
      contactId: contact.id,
      workspaceId: user.workspaceId,
      subject: `Conversation with ${name}`,
    },
  });

  // Trigger automation
  await triggerAutomation(user.workspaceId, "NEW_CONTACT", { contact });

  return NextResponse.json({ contact }, { status: 201 });
}
