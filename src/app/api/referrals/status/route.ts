import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Handle fetching code logic or setting up the referral instance.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeReferralsCreated = await prisma.referral.findMany({
      where: { referrerWorkspaceId: user.workspaceId },
      include: {
        referred: {
          select: { name: true },
        },
      },
    });

    const activeReferrer = await prisma.referral.findFirst({
      where: { referrerWorkspaceId: user.workspaceId },
    });

    let code = activeReferrer?.referralCode;

    if (!code) {
      // Simple hash hash function based on workspaceId
      code = Buffer.from(user.workspaceId)
        .toString("base64")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 8);
    }

    return NextResponse.json({
      code,
      history: activeReferralsCreated.map(
        (r: {
          id: string;
          status: string;
          rewardAmount: number;
          referred: { name: string } | null;
          createdAt: Date;
        }) => ({
          id: r.id,
          status: r.status,
          reward: r.rewardAmount,
          referredName: r.referred?.name || "Unknown Workspace",
          date: r.createdAt.toISOString(),
        })
      ),
    });
  } catch (error) {
    console.error("[Referral Status Error]:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
