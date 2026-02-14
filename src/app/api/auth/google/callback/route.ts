import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setAuthCookie } from "@/lib/auth";
import { getGoogleTokens, getGoogleUser } from "@/lib/google";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    // Handle OAuth errors from Google
    if (errorParam) {
        console.error(`[Google Auth Callback] OAuth error from Google: ${errorParam}`);
        return NextResponse.redirect(new URL(`/login?error=google_auth_failed&message=${encodeURIComponent(`Google error: ${errorParam}`)}`, req.url));
    }

    if (!code) {
        console.error("[Google Auth Callback] No authorization code received");
        return NextResponse.redirect(new URL("/login?error=google_auth_failed&message=No authorization code", req.url));
    }

    try {
        console.log("[Google Auth Callback] Exchanging code for tokens...");
        const { id_token, access_token } = await getGoogleTokens(code);
        console.log("[Google Auth Callback] Tokens received successfully");
        
        console.log("[Google Auth Callback] Fetching Google user info...");
        const googleUser = await getGoogleUser(id_token, access_token);
        console.log(`[Google Auth Callback] User info received: ${googleUser.email}`);

        if (!googleUser.emailVerified && !googleUser.verified_email) {
            console.error("[Google Auth Callback] Email not verified");
            return NextResponse.redirect(new URL("/login?error=google_auth_failed&message=Email not verified", req.url));
        }

        // Check if user exists
        console.log(`[Google Auth Callback] Looking up user: ${googleUser.email}`);
        let user = null;
        try {
            user = await prisma.user.findUnique({
                where: { email: googleUser.email },
            });
            console.log(`[Google Auth Callback] User lookup result: ${user ? 'found' : 'not found'}`);
        } catch (dbError) {
            console.error("[Google Auth Callback] Database error during user lookup:", dbError);
            throw new Error("Database error during user lookup");
        }

        if (!user) {
            console.log("[Google Auth Callback] Creating new user with workspace...");
            
            // Create workspace first
            const workspace = await prisma.workspace.create({
                data: { 
                    name: `${googleUser.name}'s Workspace`, 
                    status: "ONBOARDING",
                    emailConfigured: !!(process.env.EMAIL_HOST && process.env.EMAIL_FROM),
                    smsConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER),
                },
            });
            console.log(`[Google Auth Callback] Workspace created: ${workspace.id}`);
            
            // Create user linked to workspace
            user = await prisma.user.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name,
                    googleId: googleUser.id,
                    passwordHash: "", // No password for Google users
                    role: "OWNER",
                    emailVerified: new Date(),
                    workspaceId: workspace.id,
                },
            });
            console.log(`[Google Auth Callback] New user created: ${user.id} with workspace: ${workspace.id}`);
        } else {
            console.log(`[Google Auth Callback] Existing user found: ${user.id}`);
            
            // Link Google ID if not linked
            if (!user.googleId) {
                console.log("[Google Auth Callback] Linking Google ID to existing user...");
                await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: googleUser.id, emailVerified: new Date() },
                });
            }
            
            // If user doesn't have a workspace, create one
            if (!user.workspaceId) {
                console.log("[Google Auth Callback] User has no workspace, creating one...");
                const workspace = await prisma.workspace.create({
                    data: { 
                        name: `${user.name || googleUser.name}'s Workspace`, 
                        status: "ONBOARDING",
                        emailConfigured: !!(process.env.EMAIL_HOST && process.env.EMAIL_FROM),
                        smsConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER),
                    },
                });
                
                await prisma.user.update({
                    where: { id: user.id },
                    data: { workspaceId: workspace.id },
                });
                
                user.workspaceId = workspace.id;
                console.log(`[Google Auth Callback] Workspace created and linked: ${workspace.id}`);
            }
        }

        console.log("[Google Auth Callback] Creating auth token...");
        const token = createToken(user.id, user.workspaceId, user.role);
        console.log(`[Google Auth Callback] Token created for user: ${user.id}`);
        
        console.log("[Google Auth Callback] Setting auth cookie...");
        try {
            await setAuthCookie(token);
            console.log("[Google Auth Callback] Auth cookie set successfully");
        } catch (cookieError) {
            console.error("[Google Auth Callback] Failed to set auth cookie:", cookieError);
            throw new Error("Failed to set authentication cookie");
        }
        
        // Determine redirect URL
        const redirectUrl = !user.workspaceId ? "/onboarding" : "/dashboard";
        console.log(`[Google Auth Callback] Redirecting to: ${redirectUrl}`);

        // Use absolute URL to ensure proper redirect
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000";
        const fullRedirectUrl = `${baseUrl}${redirectUrl}`;
        console.log(`[Google Auth Callback] Full redirect URL: ${fullRedirectUrl}`);

        return NextResponse.redirect(fullRedirectUrl);

    } catch (error) {
        console.error("[Google Auth Callback] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[Google Auth Callback] Error details:", errorMessage);
        return NextResponse.redirect(new URL(`/login?error=google_auth_failed&message=${encodeURIComponent(errorMessage)}`, req.url));
    }
}
