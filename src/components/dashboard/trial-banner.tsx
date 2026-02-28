import React from "react";
import Link from "next/link";
import { getTrialDaysRemaining, isTrialActive, isTrialExpired, getTrialUrgency } from "@/lib/trial";
import { AlertCircle, Clock } from "lucide-react";

/**
 * Server component that displays a trial countdown banner.
 *
 * @param props
 * @param props.workspaceId The ID of the workspace
 */
export async function TrialBanner({ workspaceId }: { workspaceId: string }) {
  const active = await isTrialActive(workspaceId);
  const expired = await isTrialExpired(workspaceId);

  if (!active && !expired) {
    return null; // Not on a trial (e.g. paid plan)
  }

  const daysRemaining = await getTrialDaysRemaining(workspaceId);
  const urgency = getTrialUrgency(daysRemaining);

  if (expired) {
    return (
      <div className="bg-destructive text-destructive-foreground flex w-full items-center justify-center p-3 text-sm font-medium">
        <AlertCircle className="mr-2 h-4 w-4" />
        Your free trial has expired. You are currently in read-only mode.
        <Link href="/pricing" className="ml-4 underline hover:no-underline">
          Upgrade Now
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full items-center justify-center p-3 text-sm font-medium ${
        urgency === "red"
          ? "bg-destructive text-destructive-foreground"
          : urgency === "yellow"
            ? "bg-yellow-500 text-yellow-950"
            : "bg-primary text-primary-foreground"
      }`}
    >
      <Clock className="mr-2 h-4 w-4" />
      {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining in your free trial.
      <Link href="/pricing" className="ml-4 font-semibold underline hover:no-underline">
        Upgrade Plan
      </Link>
    </div>
  );
}
