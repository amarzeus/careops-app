import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateInventoryForecast, isQuotaError, getWorkspaceGeminiModel } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

/**
 *
 * @param req
 */
export async function POST(_req: Request) {
    const user = await getCurrentUser();
    if (!user || !user.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get the model preference for this workspace
    const model = await getWorkspaceGeminiModel(user.workspaceId);

    const items = await prisma.inventoryItem.findMany({
        where: { workspaceId: user.workspaceId! },
        select: { name: true, quantity: true, threshold: true, unit: true }
    });

    try {
        const forecast = await generateInventoryForecast(items, model);
        return NextResponse.json({ forecast });
    } catch (error) {
        if (isQuotaError(error)) {
            return NextResponse.json({
                error: "AI limit reached",
                message: "Inventory forecasting is temporarily unavailable."
            }, { status: 429 });
        }
        return NextResponse.json({ error: "Forecast failed" }, { status: 500 });
    }
}
