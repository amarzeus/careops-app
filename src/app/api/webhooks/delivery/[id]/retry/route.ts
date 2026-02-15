import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manualWebhookRetry } from "@/lib/webhook-retry";

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    // Verify the delivery log belongs to this workspace
    const deliveryLog = await prisma.webhookDeliveryLog.findUnique({
      where: { id },
      select: { workspaceId: true }
    });

    if (!deliveryLog) {
      return NextResponse.json({ error: "Delivery log not found" }, { status: 404 });
    }

    if (deliveryLog.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const result = await manualWebhookRetry(id, user.workspaceId);

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Manual webhook retry error:", error);
    return NextResponse.json(
      { error: "Failed to retry webhook" },
      { status: 500 }
    );
  }
}