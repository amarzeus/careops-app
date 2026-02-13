import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { refineMessage } from "@/lib/gemini";

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { content, tone } = await req.json();
    if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });

    const refined = await refineMessage(content, tone || "professional");
    return NextResponse.json({ refined });
}
