import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 *
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const links = await prisma.serviceInventoryLink.findMany({
    where: {
      inventory: { workspaceId: user.workspaceId },
    },
    include: {
      service: { select: { id: true, name: true } },
      inventory: { select: { id: true, name: true, quantity: true, threshold: true } },
    },
  });

  return NextResponse.json({ links });
}

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { serviceId, inventoryId, quantity } = await req.json();

  if (!serviceId || !inventoryId)
    return NextResponse.json(
      { error: "Service ID and Inventory ID are required" },
      { status: 400 }
    );

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });
  if (!service || service.workspaceId !== user.workspaceId)
    return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const inventory = await prisma.inventoryItem.findUnique({
    where: { id: inventoryId },
  });
  if (!inventory || inventory.workspaceId !== user.workspaceId)
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

  const link = await prisma.serviceInventoryLink.upsert({
    where: {
      serviceId_inventoryId: { serviceId, inventoryId },
    },
    update: { quantity: quantity || 1 },
    create: {
      serviceId,
      inventoryId,
      quantity: quantity || 1,
    },
  });

  return NextResponse.json({ link }, { status: 201 });
}

/**
 *
 * @param req
 */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("id");

  if (!linkId)
    return NextResponse.json({ error: "Link ID is required" }, { status: 400 });

  const link = await prisma.serviceInventoryLink.findUnique({
    where: { id: linkId },
    include: { inventory: true },
  });

  if (!link || link.inventory.workspaceId !== user.workspaceId)
    return NextResponse.json({ error: "Link not found" }, { status: 404 });

  await prisma.serviceInventoryLink.delete({ where: { id: linkId } });

  return NextResponse.json({ success: true });
}
