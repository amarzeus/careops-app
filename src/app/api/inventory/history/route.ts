import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 *
 * @param req
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const logs = await prisma.inventoryLog.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        item: {
          select: {
            name: true,
            unit: true,
          },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Inventory history error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory history" }, { status: 500 });
  }
}
