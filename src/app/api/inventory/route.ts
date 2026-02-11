import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerAutomation } from "@/lib/automation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.inventoryItem.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    name,
    description,
    quantity,
    threshold,
    unit,
    vendorName,
    vendorEmail,
    vendorPhone,
  } = await req.json();
  if (!name)
    return NextResponse.json(
      { error: "Item name is required" },
      { status: 400 }
    );

  const item = await prisma.inventoryItem.create({
    data: {
      name,
      description,
      quantity: quantity ? parseInt(String(quantity)) : 0,
      threshold: threshold ? parseInt(String(threshold)) : 5,
      unit: unit || "units",
      vendorName,
      vendorEmail,
      vendorPhone,
      workspaceId: user.workspaceId,
    },
  });

  if (item.quantity <= item.threshold) {
    await triggerAutomation(user.workspaceId, "INVENTORY_LOW", { item });
  }

  return NextResponse.json({ item }, { status: 201 });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, quantity, threshold, unit } = await req.json();
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const existingItem = await prisma.inventoryItem.findFirst({
    where: { id, workspaceId: user.workspaceId },
  });
  if (!existingItem) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name,
      quantity: quantity ? parseInt(String(quantity)) : undefined,
      threshold: threshold ? parseInt(String(threshold)) : undefined,
      unit,
    },
  });

  return NextResponse.json({ item });
}
