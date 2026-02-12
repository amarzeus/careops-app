/**
 * SMS module — delegates to MSG91.
 * This wrapper keeps the existing import API (`sendSMS`, `buildOTPMessage`)
 * so that callers don't need to change, while removing the Twilio dependency.
 */

import { sendSMS as msg91SendSMS } from "@/lib/msg91";

interface SMSOptions {
  to: string;
  body: string;
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  return msg91SendSMS(options.to, options.body);
}

export function buildOTPMessage(otp: string): string {
  return `Your CareOps verification code is: ${otp}. It expires in 15 minutes. Do not share this code.`;
}
