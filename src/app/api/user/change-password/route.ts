
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";

/**
 *
 * @param req
 */
export async function PUT(req: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current and new password are required" },
                { status: 400 }
            );
        }

        // Verify current password
        // We need to fetch the passwordHash which isn't in currentUser object usually (depends on auth implementation)
        // Let's fetch sensitive data explicitly
        const userWithPassword = await prisma.user.findUnique({
            where: { id: currentUser.id },
        });

        if (!userWithPassword || !userWithPassword.passwordHash) {
            // Should not happen for password-auth users, but safeguard
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isValid = await verifyPassword(currentPassword, userWithPassword.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                { error: "Incorrect current password" },
                { status: 400 }
            );
        }

        // Hash new password and update
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: currentUser.id },
            data: { passwordHash: hashedPassword },
        });

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Failed to update password" },
            { status: 500 }
        );
    }
}
