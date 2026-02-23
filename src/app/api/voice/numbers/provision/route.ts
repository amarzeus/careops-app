import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  purchasePhoneNumber,
  getMonthlyCost,
  getRegulatoryRequirements,
} from "@/lib/twilio-platform";
import { checkUsageLimit } from "@/lib/razorpay-subscriptions";
import { getPlanLimits } from "@/lib/razorpay";

/**
 *
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phoneNumber, country, numberType, agentId, friendlyName } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: user.workspaceId },
      select: { planKey: true },
    });

    const planKey = (subscription?.planKey || "free") as "free" | "growth" | "pro" | "enterprise";
    const limits = getPlanLimits(planKey);

    if (limits.phoneNumbers !== -1) {
      const currentCount = await prisma.phoneNumber.count({
        where: { workspaceId: user.workspaceId },
      });

      if (currentCount >= limits.phoneNumbers) {
        return NextResponse.json(
          {
            error: `Phone number limit reached. Your ${planKey} plan allows ${limits.phoneNumbers} phone number(s). Please upgrade.`,
            code: "LIMIT_EXCEEDED",
            limit: limits.phoneNumbers,
            current: currentCount,
          },
          { status: 402 }
        );
      }
    }

    const voiceLimit = await checkUsageLimit(user.workspaceId, "voice_minutes");
    if (!voiceLimit.allowed && voiceLimit.limit !== -1) {
      return NextResponse.json(
        {
          error: "Voice features not available on your plan. Please upgrade.",
          code: "PLAN_LIMITATION",
        },
        { status: 402 }
      );
    }

    const existingNumber = await prisma.phoneNumber.findUnique({
      where: { phoneNumber },
    });

    if (existingNumber) {
      return NextResponse.json(
        { error: "Phone number already in use", code: "NUMBER_TAKEN" },
        { status: 409 }
      );
    }

    const regulatory = getRegulatoryRequirements(country || "US", numberType || "local");
    if (regulatory.required) {
      const existingDocs = await prisma.complianceDocument.count({
        where: {
          workspaceId: user.workspaceId,
          status: "VERIFIED",
          documentType: { in: regulatory.documents },
        },
      });

      if (existingDocs < regulatory.documents.length) {
        return NextResponse.json(
          {
            error: "Compliance documents required for this number type",
            code: "COMPLIANCE_REQUIRED",
            requirements: regulatory,
          },
          { status: 403 }
        );
      }
    }

    const result = await purchasePhoneNumber({
      workspaceId: user.workspaceId,
      phoneNumber,
      friendlyName: friendlyName || "Main Number",
      agentId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to purchase phone number" },
        { status: 500 }
      );
    }

    const monthlyCost = getMonthlyCost(country || "US", numberType || "local");

    await prisma.phoneNumber.update({
      where: { id: result.phoneNumber!.id },
      data: {
        country: country || "US",
        numberType: numberType || "local",
        monthlyFee: monthlyCost * 75,
      },
    });

    return NextResponse.json({
      success: true,
      phoneNumber: {
        id: result.phoneNumber!.id,
        phoneNumber: result.phoneNumber!.phoneNumber,
        twilioPhoneSid: result.phoneNumber!.twilioPhoneSid,
        vapiPhoneId: result.phoneNumber!.vapiPhoneId,
        monthlyFee: monthlyCost * 75,
      },
    });
  } catch (error) {
    console.error("[PhoneNumber:Provision] Error:", error);
    return NextResponse.json({ error: "Failed to provision phone number" }, { status: 500 });
  }
}
