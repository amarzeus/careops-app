import crypto from "crypto";
import { prisma } from "./prisma";

export function generateOTP(): string {
    // Generate a cryptographically secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

export function getOTPExpiry(): Date {
    // OTP expires in 15 minutes
    return new Date(Date.now() + 15 * 60 * 1000);
}

export async function storeOTP(userId: string, otp: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            otpCode: otp,
            otpExpires: getOTPExpiry(),
        },
    });
}
