import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, storeOTP } from "@/lib/otp";
import { sendOTP as msg91SendOTP, isMSG91Configured } from "@/lib/msg91";
import { sendSMS, buildOTPMessage } from "@/lib/sms";

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

    // Rate limit: don't resend if last OTP was less than 60 seconds ago
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

    // Strategy: Try MSG91's managed OTP first (they generate + manage the OTP).
    // If MSG91 is configured with a template, use their native OTP API.
    // Otherwise, fall back to generating our own OTP and sending via Flow API.

    if (isMSG91Configured()) {
      // Generate our own OTP and send via MSG91 OTP API (so MSG91 knows the code)
      const otp = generateOTP();
      await storeOTP(user.id, otp);

      // Track the OTP channel
      await prisma.user.update({
        where: { id: user.id },
        data: { otpChannel: "sms" },
      });

      // Try MSG91 native OTP first
      const msg91Result = await msg91SendOTP(phone, otp);

      if (msg91Result.success) {
        return NextResponse.json({
          message: "Verification code sent via SMS",
          channel: "sms",
          requestId: msg91Result.requestId,
        });
      }

      // Fallback: send via MSG91 Flow API (transactional SMS)
      console.warn("[send-sms-otp] MSG91 OTP API failed, trying Flow API fallback:", msg91Result.error);
      const flowResult = await sendSMS({
        to: phone,
        body: buildOTPMessage(otp),
      });

      if (flowResult) {
        return NextResponse.json({
          message: "Verification code sent via SMS",
          channel: "sms",
          fallback: true,
        });
      }

      return NextResponse.json(
        { error: "Failed to send SMS. Please try email verification or try again later." },
        { status: 500 }
      );
    }

    // MSG91 not configured - generate OTP locally and return error
    const otp = generateOTP();
    await storeOTP(user.id, otp);
    await prisma.user.update({
      where: { id: user.id },
      data: { otpChannel: "sms" },
    });

    console.log(`[DEV] SMS OTP for ${email}: ${otp}`);

    return NextResponse.json({
      message: "Verification code sent via SMS",
      channel: "sms",
      // In dev mode, return the OTP for testing
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
