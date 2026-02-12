import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, storeOTP } from "@/lib/otp";
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

    // Validate phone format (basic E.164 check)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Use E.164 format (e.g., +1234567890)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Rate limit: don't resend if last OTP was less than 60 seconds ago
    if (user.otpExpires) {
      const lastSent = new Date(user.otpExpires.getTime() - 15 * 60 * 1000);
      const secondsSinceSent = (Date.now() - lastSent.getTime()) / 1000;
      if (secondsSinceSent < 60) {
        return NextResponse.json(
          { error: "Please wait before requesting a new code" },
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

    const sent = await sendSMS({
      to: phone,
      body: buildOTPMessage(otp),
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send SMS. Check MSG91 configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification code sent via SMS",
    });
  } catch (error) {
    console.error("Send SMS OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send SMS OTP" },
      { status: 500 }
    );
  }
}
