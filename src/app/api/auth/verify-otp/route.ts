import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setAuthCookie } from "@/lib/auth";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  try {
    const { identifier, otp, method = "email" } = await req.json();

    if (!identifier || !otp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: method === "email" ? { email: identifier } : { phone: identifier },
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

    // For SMS/WhatsApp/Email, we always use local DB verification now
    // (Twilio Verify is not used, we just send SMS/WhatsApp via Twilio and verify locally)
    if (!verified) {
      if (user.otpCode !== otp) {
        // Development bypass for easy testing
        if (process.env.NODE_ENV !== "production" && otp === "123456") {
          console.log("------------------------------------------");
          console.log(`BYPASS: Using magic OTP 123456 for ${identifier}`);
          console.log("------------------------------------------");
          verified = true;
        } else {
          return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
        }
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
