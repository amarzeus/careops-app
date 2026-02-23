import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, storeOTP } from "@/lib/otp";
import { sendWhatsAppOTP as twilioSendWhatsAppOTP } from "@/lib/twilio";
import { isAvailable as isWhatsAppAvailable } from "@/lib/whatsapp";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  try {
    const { email, phone } = await req.json();

    if (!email || !phone) {
      return NextResponse.json({ error: "Email and phone number are required" }, { status: 400 });
    }

    // Validate phone format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Use E.164 format (e.g., +919876543210)" },
        { status: 400 }
      );
    }

    // Check if WhatsApp is configured and enabled
    if (!isWhatsAppAvailable()) {
      return NextResponse.json(
        { error: "WhatsApp is not available. Please use SMS or email verification instead." },
        { status: 503 }
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
          {
            error: "Please wait before requesting a new code",
            retryAfter: Math.ceil(60 - secondsSinceSent),
          },
          { status: 429 }
        );
      }
    }

    // Store phone on user record
    await prisma.user.update({
      where: { id: user.id },
      data: { phone },
    });

    // Generate OTP and store locally
    const otp = generateOTP();
    await storeOTP(user.id, otp);

    // Track the OTP channel
    await prisma.user.update({
      where: { id: user.id },
      data: { otpChannel: "whatsapp" },
    });

    // Send via WhatsApp
    const result = await twilioSendWhatsAppOTP(phone, otp);

    if (result.success) {
      return NextResponse.json({
        message: "Verification code sent via WhatsApp",
        channel: "whatsapp",
        requestId: result.requestId,
      });
    }

    // WhatsApp failed
    console.error("[send-whatsapp-otp] WhatsApp delivery failed:", result.error);

    return NextResponse.json(
      {
        error: `Failed to send WhatsApp message: ${result.error}`,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Send WhatsApp OTP error:", error);
    return NextResponse.json({ error: "Failed to send WhatsApp OTP" }, { status: 500 });
  }
}
