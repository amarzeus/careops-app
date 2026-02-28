import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { withValidation } from "@/lib/api-validation";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 * Authenticates a user with email and password.
 */
export const POST = withValidation(loginSchema, async (_req: NextRequest, data) => {
  try {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { workspace: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Generate a new OTP and send it
      const { generateOTP, storeOTP } = await import("@/lib/otp");
      const { sendEmail, buildEmailTemplate } = await import("@/lib/email");
      const otp = generateOTP();
      await storeOTP(user.id, otp);
      await sendEmail({
        to: user.email,
        subject: "Verify your email - CareOps",
        html: buildEmailTemplate(
          "Verify your email",
          `<p>Your verification code is:</p><h1 style="font-size:36px;letter-spacing:8px;text-align:center;color:#2563eb;">${otp}</h1><p>This code expires in 15 minutes.</p>`
        ),
      });

      return NextResponse.json(
        { error: "Email not verified", requiresVerification: true, email: user.email },
        { status: 403 }
      );
    }

    const token = createToken(user.id, user.workspaceId, user.role);
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      workspace: user.workspace,
      // Token is set via httpOnly cookie - not exposed in response for security
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
});
