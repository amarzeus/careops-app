import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { aiOnboardingAssistant } from "@/lib/gemini";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, currentStep, businessInfo } = await req.json();
  if (!message)
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );

  const response = await aiOnboardingAssistant(
    message,
    currentStep || 1,
    businessInfo || {}
  );
  return NextResponse.json(response);
}
