import { NextResponse } from "next/server";
import { getPendingJobs, processWebhookJob } from "@/lib/webhook-queue";

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 10;

/**
 *
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await getPendingJobs(BATCH_SIZE);

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No pending jobs",
      });
    }

    const results = await Promise.allSettled(
      jobs.map(async (job) => {
        const result = await processWebhookJobByData(job);
        return { callSid: job.callSid, ...result };
      })
    );

    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && (r.value as { success: boolean }).success
    ).length;

    const failed = results.length - succeeded;

    return NextResponse.json({
      success: true,
      processed: results.length,
      succeeded,
      failed,
      results: results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: r.reason?.message || "Unknown error" }
      ),
    });
  } catch (error) {
    console.error("[Cron:ProcessWebhooks] Error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook jobs" },
      { status: 500 }
    );
  }
}

/**
 *
 */
async function processWebhookJobByData(
  job: Awaited<ReturnType<typeof getPendingJobs>>[0]
): Promise<{ success: boolean; error?: string; processedAt: Date }> {
  const { prisma } = await import("@/lib/prisma");

  const dbJob = await prisma.webhookJob.findFirst({
    where: { callSid: job.callSid, status: { in: ["pending", "retrying"] } },
  });

  if (!dbJob) {
    return { success: false, error: "Job not found in database", processedAt: new Date() };
  }

  return processWebhookJob(dbJob.id);
}
