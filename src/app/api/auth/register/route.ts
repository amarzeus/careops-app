import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { withValidation } from "@/lib/api-validation";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

/**
 * POST /api/auth/register
 * Registers a new user and workspace.
 */
export const POST = withValidation(registerSchema, async (_req: NextRequest, data) => {
  try {
    const { email, password, name } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
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

    await prisma.subscription.create({
      data: {
        workspaceId: workspace.id,
        planKey: "free",
        status: "active",
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
      userId: user.id,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("[Register API] Critical failure:", error);

    // Check for Prisma/Database connection errors
    if (
      err.code?.startsWith("P") ||
      err.message?.includes("prisma") ||
      err.message?.includes("database")
    ) {
      return NextResponse.json(
        { error: "Database connection error. Please verify your DATABASE_URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
});
