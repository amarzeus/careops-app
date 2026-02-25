import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSmartReply, isQuotaError, getWorkspaceGeminiModel } from "@/lib/gemini";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await req.json();
  if (!conversationId)
    return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  // Ownership verification: ensure the conversation belongs to the user's workspace
  if (conversation.workspaceId !== user.workspaceId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const history = conversation.messages
    .reverse()
    .map(
      (m: { direction: string; content: string }) =>
        `${m.direction === "INBOUND" ? conversation.contact.name : "Staff"}: ${m.content}`
    )
    .join("\n");
  const lastInbound = conversation.messages
    .filter((m: { direction: string }) => m.direction === "INBOUND")
    .pop();

  const workspace = await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
  });

  // Get the model preference for this workspace
  const model = await getWorkspaceGeminiModel(user.workspaceId);

  try {
    const replies = await generateSmartReply(
      workspace?.name || "Business",
      history,
      lastInbound?.content || "Hello",
      model
    );

    return NextResponse.json({ replies });
  } catch (error) {
    console.error("Smart reply error:", error);
    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          error: "AI limit reached",
          message: "Smart replies are temporarily unavailable.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Failed to generate replies" }, { status: 500 });
  }
}
