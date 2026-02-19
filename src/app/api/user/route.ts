
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, removeAuthCookie } from "@/lib/auth";

/**
 *
 */
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                workspaceId: true,
            },
        });

        return NextResponse.json({ user });
    } catch (_error) {
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}

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

        const body = await req.json();
        const { name, phone } = body;

        const updatedUser = await prisma.user.update({
            where: { id: currentUser.id },
            data: { name, phone },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
            },
        });

        return NextResponse.json({ user: updatedUser });
    } catch (_error) {
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

/**
 *
 */
export async function DELETE() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Hard delete the user
        await prisma.user.delete({
            where: { id: currentUser.id },
        });

        // Clear auth cookie
        await removeAuthCookie();

        return NextResponse.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}
