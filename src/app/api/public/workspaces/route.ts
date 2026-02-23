import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 *
 */
export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {},
      select: {
        id: true,
        name: true,
        address: true,
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
      },
    });

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
  }
}
