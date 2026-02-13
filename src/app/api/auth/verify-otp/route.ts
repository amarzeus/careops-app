import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setAuthCookie } from "@/lib/auth";
import { verifyOTP as msg91VerifyOTP, isMSG91Configured } from "@/lib/msg91";

export async function POST(req: Request) {
  try {
    const { email, otp, phone } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { workspace: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" });
    }

    if (!user.otpCode || !user.otpExpires) {
      return NextResponse.json(
        { error: "No OTP request found. Please request a new code." },
        { status: 400 }
      );
    }

    // Determine verification strategy based on channel
    const otpChannel = user.otpChannel || "email";
    let verified = false;

    // Strategy 1: If SMS OTP was sent via MSG91, try MSG91 verification first
    if (otpChannel === "sms" && isMSG91Configured() && (phone || user.phone)) {
      const verifyPhone = phone || user.phone;
      const msg91Result = await msg91VerifyOTP(verifyPhone!, otp);

      if (msg91Result.success) {
        verified = true;
      } else {
        // MSG91 verification failed — fall back to local check
        console.warn("[verify-otp] MSG91 verification failed, trying local:", msg91Result.error);
      }
    }

    // Strategy 2: Local DB verification (works for email, WhatsApp, and SMS fallback)
    if (!verified) {
      if (user.otpCode !== otp) {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      }

      if (new Date() > user.otpExpires) {
        return NextResponse.json(
          { error: "OTP expired. Please request a new code." },
          { status: 400 }
        );
      }

      verified = true;
    }

    if (!verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    // Mark user as verified
    const updateData: Record<string, unknown> = {
      emailVerified: new Date(),
      otpCode: null,
      otpExpires: null,
      otpChannel: null,
    };

    // If phone was used for verification, also mark phone as verified
    if (otpChannel === "sms" || otpChannel === "whatsapp") {
      updateData.phoneVerified = new Date();
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Login user
    const token = createToken(user.id, user.workspaceId, user.role);
    await setAuthCookie(token);

    return NextResponse.json({
      message: "Email verified successfully",
      workspace: user.workspace,
      channel: otpChannel,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
