import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, hashPassword } from "@/lib/auth";

interface SeedPayload {
  email: string;
  name: string;
  password?: string;
  status?: string;
  role?: string;
  onboardingStep?: number | string;
  canAccessInbox?: boolean;
  canAccessBookings?: boolean;
  canAccessForms?: boolean;
  canAccessInventory?: boolean;
}

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_SEED !== "true") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    const body: SeedPayload = await req.json();
    const { email, name, password, status } = body;

    // Ensure onboardingStep is an integer
    let step = 1;
    if (body.onboardingStep) {
      step =
        typeof body.onboardingStep === "string"
          ? parseInt(body.onboardingStep, 10)
          : body.onboardingStep;
      if (isNaN(step)) step = 1;
    }

    // Cleanup existing user if any
    await prisma.user.deleteMany({ where: { email } });

    const workspace = await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        status: status || "ONBOARDING",
        onboardingStep: step,
      },
    });

    const passwordHash = await hashPassword(password || "password123");

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: body.role || "OWNER",
        workspaceId: workspace.id,
        emailVerified: new Date(),
        canAccessInbox: body.canAccessInbox ?? true,
        canAccessBookings: body.canAccessBookings ?? true,
        canAccessForms: body.canAccessForms ?? true,
        canAccessInventory: body.canAccessInventory ?? true,
      },
    });

    const token = createToken(user.id, workspace.id, user.role);

    return NextResponse.json({ token, user, workspace });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed", details: String(error) }, { status: 500 });
  }
}
