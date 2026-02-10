import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, fields, serviceId } = await req.json();
  if (!name)
    return NextResponse.json(
      { error: "Form name is required" },
      { status: 400 }
    );

  const form = await prisma.intakeForm.create({
    data: {
      name,
      description,
      fields: fields ? JSON.stringify(fields) : "[]",
      serviceId,
      workspaceId: user.workspaceId,
    },
  });

  return NextResponse.json({ form }, { status: 201 });
}
