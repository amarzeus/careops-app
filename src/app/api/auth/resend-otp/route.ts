import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, storeOTP } from "@/lib/otp";
import { sendEmail, buildEmailTemplate } from "@/lib/email";
import { sendOTP as msg91SendOTP, resendOTP as msg91ResendOTP, sendWhatsAppOTP, isMSG91Configured, isWhatsAppConfigured } from "@/lib/msg91";
import { sendSMS, buildOTPMessage } from "@/lib/sms";

export async function POST(req: Request) {
  try {
    const { email, channel, phone } = await req.json();

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
      const lastSent = new Date(user.otpExpires.getTime() - 15 * 60 * 1000);
      const secondsSinceSent = (Date.now() - lastSent.getTime()) / 1000;
      if (secondsSinceSent < 60) {
        return NextResponse.json(
          { error: "Please wait before requesting a new code", retryAfter: Math.ceil(60 - secondsSinceSent) },
          { status: 429 }
        );
      }
    }

    // Determine the delivery channel
    const deliveryChannel = channel || user.otpChannel || "email";
    const otp = generateOTP();
    await storeOTP(user.id, otp);

    // Track channel
    await prisma.user.update({
      where: { id: user.id },
      data: { otpChannel: deliveryChannel },
    });

    switch (deliveryChannel) {
      case "sms": {
        const userPhone = phone || user.phone;
        if (!userPhone) {
          return NextResponse.json(
            { error: "Phone number is required for SMS verification" },
            { status: 400 }
          );
        }

        // Try MSG91's resend API first (if an OTP session already exists)
        if (isMSG91Configured()) {
          // Try native OTP API
          const result = await msg91SendOTP(userPhone, otp);
          if (result.success) {
            return NextResponse.json({
              message: "A new code has been sent via SMS.",
              channel: "sms",
            });
          }

          // Fallback to Flow API
          const sent = await sendSMS({ to: userPhone, body: buildOTPMessage(otp) });
          if (sent) {
            return NextResponse.json({
              message: "A new code has been sent via SMS.",
              channel: "sms",
            });
          }
        }

        return NextResponse.json(
          { error: "Failed to send SMS. Please try email verification." },
          { status: 500 }
        );
      }

      case "whatsapp": {
        const userPhone = phone || user.phone;
        if (!userPhone) {
          return NextResponse.json(
            { error: "Phone number is required for WhatsApp verification" },
            { status: 400 }
          );
        }

        if (!isWhatsAppConfigured()) {
          return NextResponse.json(
            { error: "WhatsApp is not configured. Please use SMS or email." },
            { status: 503 }
          );
        }

        const result = await sendWhatsAppOTP(userPhone, otp);
        if (result.success) {
          return NextResponse.json({
            message: "A new code has been sent via WhatsApp.",
            channel: "whatsapp",
          });
        }

        return NextResponse.json(
          { error: "Failed to send WhatsApp message. Please try SMS or email." },
          { status: 500 }
        );
      }

      case "email":
      default: {
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
          channel: "email",
        });
      }
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Failed to resend code" },
      { status: 500 }
    );
  }
}
