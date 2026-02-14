import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const voiceAgents = await prisma.voiceAgent.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        phoneNumbers: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        voiceAgent: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ voiceAgents, phoneNumbers });
  } catch (error) {
    console.error("Error fetching voice data:", error);
    return NextResponse.json({ error: "Failed to fetch voice data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.workspaceId || user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === "createAgent") {
      const agent = await prisma.voiceAgent.create({
        data: {
          name: data.name,
          description: data.description,
          greeting: data.greeting,
          prompt: data.prompt,
          canBook: data.canBook || false,
          canCheckStatus: data.canCheckStatus || false,
          canTransfer: data.canTransfer || false,
          canHandleInquiry: data.canHandleInquiry || true,
          tools: JSON.stringify(data.tools || []),
          workspaceId: user.workspaceId,
        },
      });
      return NextResponse.json({ agent });
    }

    if (action === "updateAgent") {
      const agent = await prisma.voiceAgent.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          greeting: data.greeting,
          prompt: data.prompt,
          canBook: data.canBook,
          canCheckStatus: data.canCheckStatus,
          canTransfer: data.canTransfer,
          canHandleInquiry: data.canHandleInquiry,
          tools: JSON.stringify(data.tools || []),
          isActive: data.isActive,
        },
      });
      return NextResponse.json({ agent });
    }

    if (action === "deleteAgent") {
      await prisma.voiceAgent.delete({ where: { id: data.id } });
      return NextResponse.json({ success: true });
    }

    if (action === "createPhoneNumber") {
      const phoneNumber = await prisma.phoneNumber.create({
        data: {
          phoneNumber: data.phoneNumber,
          label: data.label,
          voiceAgentId: data.voiceAgentId || null,
          forwardToStaff: data.forwardToStaff || false,
          forwardNumber: data.forwardNumber,
          workspaceId: user.workspaceId,
        },
      });
      return NextResponse.json({ phoneNumber });
    }

    if (action === "updatePhoneNumber") {
      const phoneNumber = await prisma.phoneNumber.update({
        where: { id: data.id },
        data: {
          label: data.label,
          voiceAgentId: data.voiceAgentId,
          forwardToStaff: data.forwardToStaff,
          forwardNumber: data.forwardNumber,
          isActive: data.isActive,
        },
      });
      return NextResponse.json({ phoneNumber });
    }

    if (action === "deletePhoneNumber") {
      await prisma.phoneNumber.delete({ where: { id: data.id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Voice settings error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
