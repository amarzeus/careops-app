import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    // Verify the inventory item belongs to this workspace
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item || item.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const logs = await prisma.inventoryLog.findMany({
      where: { itemId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Inventory history error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory history" }, { status: 500 });
  }
}
