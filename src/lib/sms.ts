/**
 * SMS module — delegates to MSG91.
 * This wrapper keeps the existing import API (`sendSMS`, `buildOTPMessage`)
 * so that callers don't need to change, while removing the Twilio dependency.
 */

import { sendSMS as msg91SendSMS, type MSG91SMSResult } from "@/lib/msg91";
import { prisma } from "./prisma";

interface SMSOptions {
  to: string;
  body: string;
  workspaceId?: string;
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  const result: MSG91SMSResult = await msg91SendSMS(options.to, options.body);
  
  if (!result.success && options.workspaceId) {
    try {
      await prisma.integrationLog.create({
        data: {
          type: "sms",
          status: "failed",
          to: options.to,
          message: options.body,
          error: result.error || "SMS delivery failed",
          workspaceId: options.workspaceId,
        },
      });
      
      await prisma.alert.create({
        data: {
          type: "automation",
          title: "SMS Delivery Failed",
          message: `Failed to send SMS to ${options.to}: ${result.error}`,
          actionUrl: "/settings/integrations",
          workspaceId: options.workspaceId,
        },
      });
    } catch (e) {
      console.error("Failed to log SMS failure:", e);
    }
  }
  
  return result.success;
}

export function buildOTPMessage(otp: string): string {
  return `Your CareOps verification code is: ${otp}. It expires in 15 minutes. Do not share this code.`;
}
