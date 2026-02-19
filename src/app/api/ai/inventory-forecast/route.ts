import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateInventoryForecast } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

/**
 *
 * @param req
 */
export async function POST(_req: Request) {
    const user = await getCurrentUser();
    if (!user || !user.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.inventoryItem.findMany({
        where: { workspaceId: user.workspaceId! },
        select: { name: true, quantity: true, threshold: true, unit: true }
    });

    const forecast = await generateInventoryForecast(items);
    return NextResponse.json({ forecast });
}
