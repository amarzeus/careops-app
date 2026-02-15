import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { triggerAutomation } from "@/lib/automation";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { trigger, data } = await req.json();
    
    if (!trigger) {
      return NextResponse.json({ error: "Trigger is required" }, { status: 400 });
    }

    await triggerAutomation(user.workspaceId, trigger, data || {});
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Automation trigger error:", error);
    return NextResponse.json({ error: "Failed to trigger automation" }, { status: 500 });
  }
}
