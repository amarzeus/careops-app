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

  const forms = await prisma.intakeForm.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      service: { select: { name: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ forms });
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

  const { name, description, fields, serviceId, documents } = await req.json();
  if (!name)
    return NextResponse.json({ error: "Form name is required" }, { status: 400 });

  const form = await prisma.intakeForm.create({
    data: {
      name,
      description,
      fields: fields ? JSON.stringify(fields) : "[]",
      documents: documents || "[]",
      serviceId,
      workspaceId: user.workspaceId,
    },
  });

  return NextResponse.json({ form }, { status: 201 });
}

/**
 *
 * @param req
 */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, description, fields, serviceId, documents } = await req.json();
  if (!id) return NextResponse.json({ error: "Form ID is required" }, { status: 400 });

  const existingForm = await prisma.intakeForm.findUnique({
    where: { id },
  });

  if (!existingForm || existingForm.workspaceId !== user.workspaceId) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const form = await prisma.intakeForm.update({
    where: { id },
    data: {
      name,
      description,
      fields: fields ? JSON.stringify(fields) : undefined,
      documents,
      serviceId,
    },
  });

  return NextResponse.json({ form });
}
