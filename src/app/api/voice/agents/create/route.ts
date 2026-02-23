import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWorkspaceVoiceAgent, AGENT_TEMPLATES, type AgentTemplateKey } from "@/lib/vapi-platform";

/**
 *
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { templateKey, businessName, services, businessHours, additionalInstructions, voiceId } = body;

    if (!templateKey || !AGENT_TEMPLATES[templateKey as AgentTemplateKey]) {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }

    if (!businessName) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: user.workspaceId },
      select: { name: true },
    });

    const servicesList = services || [];
    if (servicesList.length === 0) {
      const existingServices = await prisma.service.findMany({
        where: { workspaceId: user.workspaceId },
        select: { name: true, duration: true },
      });
      servicesList.push(...existingServices.map((s) => ({ ...s, price: undefined })));
    }

    const defaultHours = {
      open: "09:00",
      close: "18:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    };

    const result = await createWorkspaceVoiceAgent(
      user.workspaceId,
      templateKey as AgentTemplateKey,
      {
        businessName: businessName || workspace?.name || "Your Business",
        services: servicesList,
        businessHours: businessHours || defaultHours,
        additionalInstructions,
        voiceId,
      }
    );

    return NextResponse.json({
      success: true,
      agentId: result.agentId,
      vapiAssistantId: result.vapiAssistantId,
    });
  } catch (error) {
    console.error("[Agent Create] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create agent" },
      { status: 500 }
    );
  }
}
