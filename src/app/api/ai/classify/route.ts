import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { classifyConversationIntent } from "@/lib/gemini";

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

    try {
        const result = await classifyConversationIntent(message, history);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Intent classification error:", error);
        return NextResponse.json({ error: "Classification failed" }, { status: 500 });
    }
}
