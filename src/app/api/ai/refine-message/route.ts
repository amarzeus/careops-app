import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { refineMessage, getWorkspaceGeminiModel } from "@/lib/gemini";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, tone } = await req.json();
  if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });

  // Get the model preference for this workspace
  const model = await getWorkspaceGeminiModel(user.workspaceId);

  const refined = await refineMessage(content, tone || "professional", model);
  return NextResponse.json({ refined });
}
