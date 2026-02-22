import { NextResponse } from "next/server";
import { extractInventoryItemsFromImage, isQuotaError, getWorkspaceGeminiModel } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";

/**
 *
 */
export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { imageBase64, mimeType } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "Image data is required" }, { status: 400 });
        }

        // Get model preference for workspace
        const model = await getWorkspaceGeminiModel(user.workspaceId);

        const scannedData = await extractInventoryItemsFromImage(imageBase64, mimeType || "image/jpeg", model);

        if (!scannedData) {
            return NextResponse.json({ error: "Failed to extract data from image" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: scannedData });
    } catch (error) {
        console.error("Inventory Scan API Error:", error);
        if (isQuotaError(error)) {
            return NextResponse.json({
                error: "AI limit reached",
                message: "Inventory scanning is temporarily unavailable due to high volume."
            }, { status: 429 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
