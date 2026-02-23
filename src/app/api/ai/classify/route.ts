import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { classifyConversationIntent, isQuotaError, getWorkspaceGeminiModel } from "@/lib/gemini";

/** POST /api/ai/classify
 *  Classifies the intent of an incoming message for inbox triage
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, history } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Get the model preference for this workspace
  const model = await getWorkspaceGeminiModel(user.workspaceId);

  try {
    const result = await classifyConversationIntent(message, history, model);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Intent classification error:", error);
    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          error: "AI limit reached",
          message: "Intent classification is temporarily unavailable due to high volume.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Classification failed" }, { status: 500 });
  }
}
