import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { getPlanLimits } from "@/lib/razorpay";

/**
 *
 * @param req
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const where: Record<string, unknown> = {
      workspaceId: user.workspaceId,
    };

    if (activeOnly) {
      where.isActive = true;
    }

    const numbers = await prisma.phoneNumber.findMany({
      where,
      include: {
        voiceAgent: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(numbers);
  } catch (error) {
    console.error("[PhoneNumber:GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch phone numbers" }, { status: 500 });
  }
}

/**
 *
 * @param req
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: user.workspaceId },
      select: { planKey: true },
    });

    const planKey = (subscription?.planKey || "free") as "free" | "growth" | "pro" | "enterprise";
    const limits = getPlanLimits(planKey);
    const maxPhoneNumbers = limits.phoneNumbers;

    if (maxPhoneNumbers !== -1) {
      const currentCount = await prisma.phoneNumber.count({
        where: { workspaceId: user.workspaceId },
      });

      if (currentCount >= maxPhoneNumbers) {
        return NextResponse.json(
          {
            error: `Phone number limit reached. Your plan allows ${maxPhoneNumbers} phone number(s). Please upgrade to add more.`,
          },
          { status: 402 }
        );
      }
    }

    const body = await req.json();
    const { phoneNumber, label, vapiPhoneId, forwardToStaff, forwardNumber, voiceAgentId } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const existing = await prisma.phoneNumber.findUnique({
      where: { phoneNumber },
    });

    if (existing) {
      return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
    }

    if (voiceAgentId) {
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

    const number = await prisma.phoneNumber.create({
      data: {
        phoneNumber,
        label,
        vapiPhoneId,
        forwardToStaff: forwardToStaff ?? false,
        forwardNumber,
        voiceAgentId,
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json(number, { status: 201 });
  } catch (error) {
    console.error("[PhoneNumber:POST] Error:", error);
    return NextResponse.json({ error: "Failed to create phone number" }, { status: 500 });
  }
}
