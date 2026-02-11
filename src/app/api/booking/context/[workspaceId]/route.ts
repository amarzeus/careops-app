import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
    try {
        const workspace = await prisma.workspace.findUnique({
            where: { id: params.workspaceId },
            select: {
                id: true,
                name: true,
                address: true,
                contactEmail: true,
                services: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        price: true,
                        description: true
                    }
                }
            }
        });

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        return NextResponse.json(workspace);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
