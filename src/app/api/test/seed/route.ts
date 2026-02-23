import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, hashPassword } from "@/lib/auth";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
    }

    try {
        const { email, name, password, status, onboardingStep } = await req.json();

        // Cleanup existing user if any
        await prisma.user.deleteMany({ where: { email } });

        const workspace = await prisma.workspace.create({
            data: {
                name: `${name}'s Workspace`,
                status: status || "ONBOARDING",
                onboardingStep: onboardingStep || 1
            }
        });

        const passwordHash = await hashPassword(password || "password123");

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role: "OWNER",
                workspaceId: workspace.id,
                emailVerified: new Date()
            }
        });

        const token = createToken(user.id, workspace.id, user.role);

        return NextResponse.json({ token, user, workspace });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: "Seed failed", details: String(error) }, { status: 500 });
    }
}
