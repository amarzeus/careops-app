import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/twilio";
import { sendEmail, buildEmailTemplate } from "@/lib/email";
import { sendSMS, buildOTPMessage } from "@/lib/sms";
import { generateOTP, storeOTP } from "@/lib/otp";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  try {
    const { email, phone, method = "email" } = await req.json();

    const normalizedPhone = method === "sms" && phone ? normalizePhoneNumber(phone) : undefined;

    console.log(
      `[ForgotPassword] Request: method=${method}, email=${email}, phone=${phone}, normalizedPhone=${normalizedPhone}`
    );

    const user = await prisma.user.findFirst({
      where: method === "email" ? { email } : { phone: normalizedPhone },
    });

    if (!user) {
      console.log(
        `[ForgotPassword] User not found for ${method === "email" ? email : normalizedPhone}`
      );
      // Return success even if user not found (security: don't reveal user existence)
      return NextResponse.json({
        message:
          method === "email"
            ? "If an account exists with this email, a reset code has been sent."
            : "If an account exists with this phone number, a reset code has been sent.",
      });
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (user.updatedAt > oneMinuteAgo) {
      console.log(`[ForgotPassword] Rate limited for user ${user.id}`);
      return NextResponse.json(
        {
          error: "Please wait a moment before requesting another code.",
        },
        { status: 429 }
      );
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
        return NextResponse.json(
          { error: "Failed to send SMS. Please try email." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message:
        method === "email"
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
