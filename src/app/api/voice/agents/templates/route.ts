import { NextResponse } from "next/server";
import { AGENT_TEMPLATES } from "@/lib/vapi-platform";

/**
 *
 */
export async function GET() {
  const templates = Object.values(AGENT_TEMPLATES).map((t) => ({
    key: t.key,
    name: t.name,
    description: t.description,
    tools: t.tools,
  }));

  return NextResponse.json({ templates });
}
