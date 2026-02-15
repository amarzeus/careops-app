import { NextResponse } from "next/server";
import { aiOnboardingAssistant } from "@/lib/gemini";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const { message, currentStep, businessInfo, conversationHistory } = await req.json();
  if (!message)
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );

  const response = await aiOnboardingAssistant(
    message,
    currentStep || 1,
    businessInfo || {},
    conversationHistory || []
  );
  return NextResponse.json(response);
}
