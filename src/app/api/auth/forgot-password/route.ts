import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken } from "@/lib/auth";
import { sendEmail, buildEmailTemplate } from "@/lib/email";
import { sendSMS, buildOTPMessage } from "@/lib/sms";
import { generateOTP, storeOTP } from "@/lib/otp";
import { v4 as uuidv4 } from "uuid";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  try {
    const { email, phone, method = "email" } = await req.json();

    if (method === "email" && !email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (method === "sms" && !phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: method === "email" ? { email } : { phone },
    });

    if (!user) {
      // Return success even if user not found (security: don't reveal user existence)
      return NextResponse.json({
        message: method === "email"
          ? "If an account exists with this email, a reset code has been sent."
          : "If an account exists with this phone number, a reset code has been sent."
      });
    }

    // Rate limiting: prevent spamming resets (1 min cooldown for OTP)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (user.updatedAt > oneMinuteAgo) {
      return NextResponse.json({
        message: "Please wait a moment before requesting another code."
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP(user.id, otp);

    if (method === "email") {
      // Send reset email with OTP
      const emailSent = await sendEmail({
        to: user.email,
        subject: "CareOps Password Reset Code",
        html: buildEmailTemplate(
          "Password Reset Code",
          `<p>Hi ${user.name},</p>
           <p>You requested a password reset. Your verification code is:</p>
           <div style="background: #f3f4f6; padding: 24px; border-radius: 8px; text-align: center; margin: 16px 0;">
             <h1 style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; margin: 0;">${otp}</h1>
           </div>
           <p>This code expires in 15 minutes. If you did not request this, please ignore this email.</p>`
        ),
      });

      if (!emailSent) {
        console.error("Failed to send password reset email to", user.email);
      }
    } else {
      // Send reset SMS with OTP
      const smsSent = await sendSMS({
        to: user.phone!,
        body: buildOTPMessage(otp),
        workspaceId: user.workspaceId || undefined,
      });

      if (!smsSent) {
        console.error("Failed to send password reset SMS to", user.phone);
        return NextResponse.json({ error: "Failed to send SMS. Please try email." }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: method === "email"
        ? "Verification code sent to your email."
        : "Verification code sent to your phone.",
      requiresOTP: true,
      email: user.email,
      phone: user.phone,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
