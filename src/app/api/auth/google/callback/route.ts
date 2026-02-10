import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setAuthCookie } from "@/lib/auth";
import { getGoogleTokens, getGoogleUser } from "@/lib/google";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "Authorization code missing" }, { status: 400 });
    }

    try {
        const { id_token, access_token } = await getGoogleTokens(code);
        const googleUser = await getGoogleUser(id_token, access_token);

        if (!googleUser.emailVerified && !googleUser.verified_email) {
            return NextResponse.json({ error: "Google email not verified" }, { status: 400 });
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        if (!user) {
            // Create new user (and workspace if needed, or ask user to create one later? 
            // For simplicity, create a default workspace or handle onboarding logic.
            // PRD implies Onboarding is critical. Let's create user with ONBOARDING status
            // but they need a workspace. 
            // Current schema requires workspaceId for User? No, workspaceId is String? (nullable).
            // Let's check schema: workspaceId String?. Yes.

            user = await prisma.user.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name,
                    googleId: googleUser.id,
                    passwordHash: "", // No password for Google users
                    role: "OWNER", // Default to owner for new signups? Or should they be invited?
                    emailVerified: new Date(),
                },
            });

            // Need to create a placeholder workspace or redirect to onboarding to create it?
            // Onboarding flow creates workspace.
            // But user must exist first.
            // Let's redirect to onboarding.
        } else {
            // Link Google ID if not linked
            if (!user.googleId) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: googleUser.id, emailVerified: new Date() },
                });
            }
        }

        const token = createToken(user.id, user.workspaceId, user.role);
        await setAuthCookie(token);

        if (!user.workspaceId) {
            return NextResponse.redirect(new URL("/onboarding", req.url));
        }

        return NextResponse.redirect(new URL("/dashboard", req.url));

    } catch (error) {
        console.error("Google Auth Error:", error);
        return NextResponse.redirect(new URL("/login?error=google_auth_failed", req.url));
    }
}
