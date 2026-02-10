import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const data = await req.json();

  const rule = await prisma.automationRule.update({
    where: { id, workspaceId: user.workspaceId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.messageTemplate !== undefined && {
        messageTemplate: data.messageTemplate,
      }),
      ...(data.delayMinutes !== undefined && {
        delayMinutes: data.delayMinutes,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return NextResponse.json({ rule });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.automationRule.delete({
    where: { id, workspaceId: user.workspaceId },
  });
  return NextResponse.json({ success: true });
}
