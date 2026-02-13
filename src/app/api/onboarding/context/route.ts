import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const user = await getCurrentUser();
    if (!user || !user.workspaceId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({
        where: { id: user.workspaceId },
        include: {
            services: true,
            inventoryItems: true,
            contactForms: true,
            intakeForms: true,
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            automationRules: true,
        },
    });

    return NextResponse.json({ context: workspace });
}
