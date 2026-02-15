import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, storeOTP } from "@/lib/otp";
import { isConfigured as isTwilioConfigured, sendOTP as twilioSendOTP } from "@/lib/twilio";
import { sendSMS, buildOTPMessage } from "@/lib/sms";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  try {
    const { email, phone } = await req.json();

    if (!email || !phone) {
      return NextResponse.json(
        { error: "Email and phone number are required" },
        { status: 400 }
      );
    }

    // Validate phone format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Use E.164 format (e.g., +919876543210)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Rate limit check
    if (user.otpExpires) {
      const lastSent = new Date(user.otpExpires.getTime() - 15 * 60 * 1000);
      const secondsSinceSent = (Date.now() - lastSent.getTime()) / 1000;
      if (secondsSinceSent < 60) {
        return NextResponse.json(
          { error: "Please wait before requesting a new code", retryAfter: Math.ceil(60 - secondsSinceSent) },
          { status: 429 }
        );
      }
    }

    // Store phone on user record
    await prisma.user.update({
      where: { id: user.id },
      data: { phone },
    });

    const otp = generateOTP();
    await storeOTP(user.id, otp);
    await prisma.user.update({
      where: { id: user.id },
      data: { otpChannel: "sms" },
    });

    if (isTwilioConfigured()) {
      const result = await twilioSendOTP(phone, otp);

      if (result.success) {
        return NextResponse.json({
          message: "Verification code sent via SMS",
          channel: "sms",
          requestId: result.requestId,
        });
      }

      console.error("[send-sms-otp] Twilio delivery failed:", result.error);
      return NextResponse.json(
        { error: `Failed to send SMS: ${result.error}` },
        { status: 500 }
      );
    }

    // In dev mode, if Twilio is not configured, still return the OTP for testing
    console.log(`[DEV] SMS OTP for ${email}: ${otp}`);

    return NextResponse.json({
      message: "Verification code sent via SMS (Mocked)",
      channel: "sms",
      ...(process.env.NODE_ENV !== "production" && { devOtp: otp }),
    });
  } catch (error) {
    console.error("Send SMS OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send SMS OTP" },
      { status: 500 }
    );
  }
}
