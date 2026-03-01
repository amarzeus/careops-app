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
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const form = await prisma.contactForm.findUnique({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });
    if (!form) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.contactForm.update({
      where: { id },
      data: { isActive: body.isActive ?? form.isActive, name: body.name ?? form.name },
    });

    return NextResponse.json(updated);
  } catch (_error) {
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
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const form = await prisma.contactForm.findUnique({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });
    if (!form) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.contactForm.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
