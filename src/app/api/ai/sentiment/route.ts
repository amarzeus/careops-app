import { NextResponse } from "next/server";
import { analyzeSentiment, isQuotaError } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/ai/sentiment
 * Analyzes the sentiment of a message string.
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
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { message } = body;
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await analyzeSentiment(message);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sentiment Error:", error);
    if (isQuotaError(error)) {
      return NextResponse.json({ score: 50, label: "neutral", emoji: "😐" }, { status: 429 });
    }
    return NextResponse.json({ score: 50, label: "neutral", emoji: "😐" }, { status: 500 });
  }
}
