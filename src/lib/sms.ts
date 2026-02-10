import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface SMSOptions {
  to: string;
  body: string;
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn("Twilio credentials not configured — skipping SMS");
      return false;
    }

    await client.messages.create({
      body: options.body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.to,
    });

    return true;
  } catch (error) {
    console.error("SMS send error:", error);
    return false;
  }
}

export function buildOTPMessage(otp: string): string {
  return `Your CareOps verification code is: ${otp}. It expires in 15 minutes. Do not share this code.`;
}
