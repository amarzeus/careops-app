import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

/**
 *
 * @param req
 */
export async function POST(req: Request) {
    try {
        const { email, phone, otp, newPassword, method = "email" } = await req.json();
        const { normalizePhoneNumber } = require("@/lib/twilio");

        const normalizedPhone = (method === "sms" && phone) ? normalizePhoneNumber(phone) : undefined;

        console.log(`[ResetPassword] Request: method=${method}, email=${email}, phone=${phone}, normalizedPhone=${normalizedPhone}, otp=${otp}`);

        const user = await prisma.user.findFirst({
            where: method === "email" ? { email } : { phone: normalizedPhone },
        });

        if (!user) {
            console.log(`[ResetPassword] User not found for ${method === "email" ? email : normalizedPhone}`);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify OTP
        if (!user.otpCode || !user.otpExpires) {
            return NextResponse.json({ error: "No reset request found" }, { status: 400 });
        }

        if (user.otpCode !== otp) {
            // Dev bypass
            if (process.env.NODE_ENV !== "production" && otp === "123456") {
                console.log("Bypassing OTP for reset");
            } else {
                return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
            }
        }

        if (new Date() > user.otpExpires) {
            return NextResponse.json({ error: "Reset code expired" }, { status: 400 });
        }

        // Hash and update password
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                otpCode: null,
                otpExpires: null,
                emailVerified: method === "email" ? new Date() : user.emailVerified,
                phoneVerified: method === "sms" ? new Date() : user.phoneVerified,
            },
        });

        return NextResponse.json({ message: "Password reset successful. You can now login." });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Reset failed" }, { status: 500 });
    }
}
