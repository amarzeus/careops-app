import { NextResponse } from "next/server";
import { aiOnboardingAssistant, getWorkspaceGeminiModel, isQuotaError } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/ai/chat
 * Primary entry point for the onboarding AI assistant
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (_e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { message, currentStep, businessInfo, conversationHistory } = body;
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get model preference for workspace
    const model = await getWorkspaceGeminiModel(user.workspaceId);

    const response = await aiOnboardingAssistant(
      message,
      currentStep || 1,
      businessInfo || {},
      conversationHistory || [],
      model
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("AI Chat Error:", error);
    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          message:
            "The CareOps AI is currently at capacity. Please try again in a moment or continue manually.",
          extractedData: null,
          shouldAdvance: false,
          navigationAction: null,
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      {
        message: "I encountered an error. Please try again or rephrase your message.",
        extractedData: null,
        shouldAdvance: false,
        navigationAction: null,
      },
      { status: 500 }
    );
  }
}
