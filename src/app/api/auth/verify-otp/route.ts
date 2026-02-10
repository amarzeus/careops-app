import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

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
                { error: "No OTP request found" },
                { status: 400 }
            );
        }

        if (user.otpCode !== otp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
        }

        if (new Date() > user.otpExpires) {
            return NextResponse.json({ error: "OTP expired" }, { status: 400 });
        }

        // Verify User
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                otpCode: null,
                otpExpires: null,
            },
        });

        // Login User
        const token = createToken(user.id, user.workspaceId, user.role);
        await setAuthCookie(token);

        return NextResponse.json({
            message: "Email verified successfully",
            workspace: user.workspace,
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return NextResponse.json(
            { error: "Verification failed" },
            { status: 500 }
        );
    }
}
