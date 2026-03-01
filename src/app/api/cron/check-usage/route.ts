import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanLimits, PlanKey } from "@/lib/razorpay";
import { sendEmail, usageWarningEmail } from "@/lib/email";

const WARNING_THRESHOLD = 0.8; // 80%

/**
 * Helper route executed via CRON to track overage metrics.
 */
export async function GET(req: Request) {
  // Simple auth for cron endpoints (in production, use a secure secret header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || "dev-cron-secret"}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
      },
      include: {
        workspace: {
          include: {
            users: {
              where: { role: "OWNER" },
            },
          },
        },
      },
    });

    const notificationsSent: string[] = [];

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    for (const sub of subscriptions) {
      if (!sub.workspace) continue;

      const planKey = (sub.planKey as PlanKey) || "free";
      const limits = getPlanLimits(planKey);

      const usageRecords = await prisma.usageRecord.findMany({
        where: {
          workspaceId: sub.workspaceId,
          periodStart: {
            gte: startOfMonth,
          },
        },
      });

      const usageMap = usageRecords.reduce(
        (acc: Record<string, number>, record: { category: string; quantity: number }) => {
          acc[record.category] = record.quantity;
          return acc;
        },
        {} as Record<string, number>
      );

      const categoriesToCheck = [
        { key: "voice_minutes", limit: limits.voiceMinutes, name: "Voice AI Minutes" },
        { key: "sms_sent", limit: limits.smsMessages, name: "SMS Messages" },
        { key: "bookings", limit: limits.bookings, name: "Bookings" },
      ];

      for (const cat of categoriesToCheck) {
        if (cat.limit === -1 || cat.limit === 0) continue;

        const used = usageMap[cat.key] || 0;
        const percentage = used / cat.limit;

        if (percentage >= WARNING_THRESHOLD) {
          const owner = sub.workspace.users[0];
          if (owner) {
            await sendEmail({
              to: owner.email,
              subject: `Action Required: Reaching limits for ${cat.name} in CareOps`,
              html: usageWarningEmail({
                userName: owner.name || "Workspace Owner",
                categoryName: cat.name,
                used,
                limit: cat.limit,
                workspaceName: sub.workspace.name,
              }),
            });
            notificationsSent.push(
              `${owner.email} (${cat.name}: ${Math.round(percentage * 100)}%)`
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true, notificationsSent });
  } catch (error) {
    console.error("[Usage Cron Error]:", error);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
