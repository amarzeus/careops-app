import { prisma } from "./prisma";

const TRIAL_DURATION_DAYS = 14;

/**
 * Check if a workspace is within its free trial period.
 */
export async function isTrialActive(workspaceId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { trialEndsAt: true, planKey: true, status: true },
  });

  if (!sub) return false;
  if (sub.planKey !== "free") return false;
  if (!sub.trialEndsAt) return false;

  return new Date() < new Date(sub.trialEndsAt);
}

/**
 * Get the number of days remaining in the trial.
 * Returns 0 if trial has expired or does not exist.
 */
export async function getTrialDaysRemaining(workspaceId: string): Promise<number> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { trialEndsAt: true },
  });

  if (!sub?.trialEndsAt) return 0;

  const diff = new Date(sub.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check if the trial has expired without conversion to a paid plan.
 */
export async function isTrialExpired(workspaceId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { trialEndsAt: true, planKey: true },
  });

  if (!sub) return false;
  if (sub.planKey !== "free") return false;
  if (!sub.trialEndsAt) return false;

  return new Date() >= new Date(sub.trialEndsAt);
}

/**
 * Start a 14-day trial for a workspace.
 */
export async function startTrial(workspaceId: string): Promise<void> {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

  await prisma.subscription.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      planKey: "free",
      status: "trialing",
      trialEndsAt: trialEnd,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
    },
    update: {
      trialEndsAt: trialEnd,
      status: "trialing",
    },
  });
}

/**
 * Get trial urgency level for UI display.
 */
export function getTrialUrgency(daysRemaining: number): "green" | "yellow" | "red" | "expired" {
  if (daysRemaining <= 0) return "expired";
  if (daysRemaining <= 3) return "red";
  if (daysRemaining <= 7) return "yellow";
  return "green";
}
