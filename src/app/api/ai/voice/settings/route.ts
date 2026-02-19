import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVapiStatus } from "@/lib/vapi";

/**
 *
 */
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

    const vapiStatus = getVapiStatus();

    return NextResponse.json({ voiceAgents, phoneNumbers, vapiStatus });
  } catch (error) {
    console.error("Error fetching voice data:", error);
    return NextResponse.json({ error: "Failed to fetch voice data" }, { status: 500 });
  }
}

/**
 *
 * @param req
 */
import { createVapiAssistant, updateVapiAssistant } from "@/lib/vapi";

const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://careops-app.onrender.com";

// Helper to construct Vapi Assistant config
const getVapiConfig = (data: any) => {
  return {
    name: data.name,
    model: {
      provider: "openai",
      model: "gpt-4",
      systemPrompt: data.prompt || "You are a helpful assistant.",
    },
    voice: {
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM", // Default voice
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    },
    serverUrl: `${NEXT_PUBLIC_APP_URL}/api/voice/tools`,
    serverMessages: ["tool-calls"],
    tools: data.tools ? JSON.parse(JSON.stringify(data.tools)) : [],
  };
};

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.workspaceId || user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === "createAgent") {
      let vapiAssistantId = null;
      try {
        const vapiConfig = getVapiConfig(data);
        const vapiAssistant = await createVapiAssistant(vapiConfig);
        vapiAssistantId = (vapiAssistant as { id: string }).id;
      } catch (e) {
        console.error("Failed to create Vapi assistant:", e);
        // Fallback: proceed without Vapi ID, or fail? specific req says "sync", so maybe warn but proceed
      }

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
          vapiAssistantId: vapiAssistantId,
        },
      });
      return NextResponse.json({ agent });
    }

    if (action === "updateAgent") {
      if (data.vapiAssistantId) {
        try {
          const vapiConfig = getVapiConfig(data);
          await updateVapiAssistant(data.vapiAssistantId, vapiConfig);
        } catch (e) {
          console.error("Failed to update Vapi assistant:", e);
        }
      } else {
        // Check if we should create one now?
        try {
          const vapiConfig = getVapiConfig(data);
          const vapiAssistant = await createVapiAssistant(vapiConfig);
          data.vapiAssistantId = (vapiAssistant as { id: string }).id;
        } catch (e) {
          console.error("Failed to backfill Vapi assistant:", e);
        }
      }

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
          vapiAssistantId: data.vapiAssistantId,
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

