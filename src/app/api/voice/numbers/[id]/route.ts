import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteVapiPhoneNumber } from "@/lib/vapi";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 *
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const number = await prisma.phoneNumber.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
      include: {
        voiceAgent: true,
      },
    });

    if (!number) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }

    return NextResponse.json(number);
  } catch (error) {
    console.error("[PhoneNumber:GET:Id] Error:", error);
    return NextResponse.json({ error: "Failed to fetch phone number" }, { status: 500 });
  }
}

/**
 *
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.phoneNumber.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }

    const { label, isActive, forwardToStaff, forwardNumber, voiceAgentId } = body;

    if (voiceAgentId !== undefined) {
      if (voiceAgentId !== null) {
        const agent = await prisma.voiceAgent.findFirst({
          where: {
            id: voiceAgentId,
            workspaceId: user.workspaceId,
          },
        });

        if (!agent) {
          return NextResponse.json({ error: "Voice agent not found" }, { status: 404 });
        }
      }
    }

    const updated = await prisma.phoneNumber.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(isActive !== undefined && { isActive }),
        ...(forwardToStaff !== undefined && { forwardToStaff }),
        ...(forwardNumber !== undefined && { forwardNumber }),
        ...(voiceAgentId !== undefined && { voiceAgentId }),
      },
      include: {
        voiceAgent: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PhoneNumber:PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update phone number" }, { status: 500 });
  }
}

/**
 *
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.phoneNumber.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }

    if (existing.vapiPhoneId) {
      try {
        await deleteVapiPhoneNumber(existing.vapiPhoneId);
      } catch (vapiError) {
        console.error("[PhoneNumber:DELETE] Vapi deletion failed:", vapiError);
      }
    }

    await prisma.phoneNumber.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PhoneNumber:DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete phone number" }, { status: 500 });
  }
}
