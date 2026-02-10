import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, storeOTP } from "@/lib/otp";
import { sendEmail, buildEmailTemplate } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal whether user exists
      return NextResponse.json({
        message: "If an account exists, a new code has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Rate limit: don't resend if last OTP was less than 60 seconds ago
    if (user.otpExpires) {
      const lastSent = new Date(user.otpExpires.getTime() - 15 * 60 * 1000); // OTP expiry minus 15 min = sent time
      const secondsSinceSent = (Date.now() - lastSent.getTime()) / 1000;
      if (secondsSinceSent < 60) {
        return NextResponse.json(
          { error: "Please wait before requesting a new code" },
          { status: 429 }
        );
      }
    }

    const otp = generateOTP();
    await storeOTP(user.id, otp);

    await sendEmail({
      to: email,
      subject: "Your new verification code - CareOps",
      html: buildEmailTemplate(
        "Verify your email",
        `<p>Your new verification code is:</p><h1 style="font-size:36px;letter-spacing:8px;text-align:center;color:#2563eb;">${otp}</h1><p>This code expires in 15 minutes.</p>`
      ),
    });

    return NextResponse.json({
      message: "If an account exists, a new code has been sent.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Failed to resend code" },
      { status: 500 }
    );
  }
}
