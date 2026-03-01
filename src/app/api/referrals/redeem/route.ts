import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Accept code for referral logic.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const existingTarget = await prisma.referral.findFirst({
      where: { referredWorkspaceId: user.workspaceId },
    });

    if (existingTarget) {
      return NextResponse.json({ error: "Workspace already referred" }, { status: 400 });
    }

    const sourceReferrer = await prisma.referral.findFirst({
      where: { referralCode: code },
    });

    let referrerWorkspaceId = sourceReferrer?.referrerWorkspaceId;

    if (!referrerWorkspaceId) {
      // Fallback to searching all active referrals to link via Base64 mapping logic fallback.
      const workAll = await prisma.workspace.findMany();
      const foundWork = workAll.find(
        (w) =>
          Buffer.from(w.id)
            .toString("base64")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 8) === code
      );

      if (!foundWork) return NextResponse.json({ error: "Invalid Code" }, { status: 400 });

      referrerWorkspaceId = foundWork.id;
    }

    if (referrerWorkspaceId === user.workspaceId) {
      return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
    }

    const newReferral = await prisma.referral.create({
      data: {
        referralCode: Buffer.from(user.workspaceId)
          .toString("base64")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 8),
        referrerWorkspaceId: referrerWorkspaceId,
        referredWorkspaceId: user.workspaceId,
        status: "COMPLETED",
        rewardAmount: 50, // Standard $50 credit or point amount
      },
    });

    return NextResponse.json({ success: true, referral: newReferral });
  } catch (error) {
    console.error("[Referral Redeem Error]:", error);
    return NextResponse.json({ error: "Failed to redeem code" }, { status: 500 });
  }
}
