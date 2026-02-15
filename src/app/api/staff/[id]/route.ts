import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER" || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const staff = await prisma.user.findUnique({ where: { id } });
    if (!staff || staff.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        canAccessInbox: body.canAccessInbox ?? staff.canAccessInbox,
        canAccessBookings: body.canAccessBookings ?? staff.canAccessBookings,
        canAccessForms: body.canAccessForms ?? staff.canAccessForms,
        canAccessInventory: body.canAccessInventory ?? staff.canAccessInventory,
        name: body.name ?? staff.name,
      },
      select: {
        id: true, name: true, email: true, role: true,
        canAccessInbox: true, canAccessBookings: true,
        canAccessForms: true, canAccessInventory: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER" || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const staff = await prisma.user.findUnique({ where: { id } });
    if (!staff || staff.workspaceId !== user.workspaceId || staff.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove this user" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
