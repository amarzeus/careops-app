import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeVoicePhoneNumber } from "@/lib/voice-compliance";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false";

    const entries = await prisma.doNotCallEntry.findMany({
      where: {
        workspaceId: user.workspaceId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[Voice:DNC:GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch DNC entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only workspace owners can manage DNC entries" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      phoneNumber?: string;
      source?: string;
      reason?: string;
      isActive?: boolean;
    };

    if (!body.phoneNumber) {
      return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
    }

    const normalizedPhone = normalizeVoicePhoneNumber(body.phoneNumber);

    const entry = await prisma.doNotCallEntry.upsert({
      where: {
        workspaceId_phoneNumber: {
          workspaceId: user.workspaceId,
          phoneNumber: normalizedPhone,
        },
      },
      create: {
        workspaceId: user.workspaceId,
        phoneNumber: normalizedPhone,
        source: body.source || "customer_request",
        reason: body.reason,
        addedBy: user.id,
        isActive: body.isActive ?? true,
      },
      update: {
        source: body.source || "customer_request",
        reason: body.reason,
        addedBy: user.id,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("[Voice:DNC:POST] Error:", error);
    return NextResponse.json({ error: "Failed to save DNC entry" }, { status: 500 });
  }
}
