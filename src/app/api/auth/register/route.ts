import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const workspace = await prisma.workspace.create({
      data: { name: `${name}'s Workspace`, status: "ONBOARDING" },
    });

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "OWNER",
        workspaceId: workspace.id,
      },
    });

    // Generate and store OTP
    const { generateOTP, storeOTP } = await import("@/lib/otp");
    const otp = generateOTP();
    await storeOTP(user.id, otp);

    // Send OTP Email
    const { sendEmail, buildEmailTemplate } = await import("@/lib/email");
    await sendEmail({
      to: email,
      subject: "Verify your email - CareOps",
      html: buildEmailTemplate(
        "Verify your email",
        `<p>Your verification code is:</p><h1>${otp}</h1><p>This code expires in 15 minutes.</p>`
      ),
    });

    return NextResponse.json({
      message: "Registration successful. Please check your email for the verification code.",
      userId: user.id
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
