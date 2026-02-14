/**
 * SMS module — delegates to Twilio.
 * This wrapper keeps the existing import API (`sendSMS`, `buildOTPMessage`)
 * so that callers don't need to change.
 * 
 * PRD Requirements:
 * - Step 2: Set Up Email & SMS - "The business owner connects: SMS service (reminders, short updates)"
 * - "Failures must be logged and visible"
 * - "At least one channel is mandatory"
 */

import { sendSMS as twilioSendSMS, type TwilioResult } from "@/lib/twilio";
import { prisma } from "./prisma";

interface SMSOptions {
  to: string;
  body: string;
  workspaceId?: string;
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  const result: TwilioResult = await twilioSendSMS(options.to, options.body);

  if (!result.success && options.workspaceId) {
    try {
      await prisma.integrationLog.create({
        data: {
          type: "sms",
          status: "failed",
          to: options.to,
          message: options.body,
          error: `${result.error} (code: ${result.errorCode})`,
          workspaceId: options.workspaceId,
        },
      });

      const alertTitle = result.errorCode === "INVALID_NUMBER" 
        ? "Invalid Phone Number" 
        : "SMS Delivery Failed";
      
      const alertMessage = result.errorCode === "INVALID_NUMBER"
        ? `Failed to send SMS to ${options.to}: Invalid phone number format`
        : `Failed to send SMS to ${options.to}: ${result.error}`;

      await prisma.alert.create({
        data: {
          type: "automation",
          title: alertTitle,
          message: alertMessage,
          actionUrl: "/settings/integrations",
          workspaceId: options.workspaceId,
        },
      });

      console.error(`[SMS] Delivery failed: ${result.error} (code: ${result.errorCode})`);
    } catch (e) {
      console.error("Failed to log SMS failure:", e);
    }
  } else if (result.success && options.workspaceId) {
    try {
      await prisma.integrationLog.create({
        data: {
          type: "sms",
          status: "success",
          to: options.to,
          message: options.body,
          workspaceId: options.workspaceId,
        },
      });
    } catch (e) {
      console.error("Failed to log SMS success:", e);
    }
  }

  return result.success;
}

export function buildOTPMessage(otp: string): string {
  return `Your CareOps verification code is: ${otp}. It expires in 15 minutes. Do not share this code.`;
}
