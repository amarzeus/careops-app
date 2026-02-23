import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER" || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.webhook.delete({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}
