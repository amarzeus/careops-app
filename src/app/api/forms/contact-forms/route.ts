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

  const forms = await prisma.contactForm.findMany({
    where: { workspaceId: user.workspaceId },
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
  if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, fields, welcomeMessage } = await req.json();
  if (!name) return NextResponse.json({ error: "Form name is required" }, { status: 400 });

  const form = await prisma.contactForm.create({
    data: {
      name,
      fields: fields
        ? JSON.stringify(fields)
        : '[{"name":"name","label":"Full Name","type":"text","required":true},{"name":"email","label":"Email","type":"email","required":true},{"name":"phone","label":"Phone","type":"tel","required":false},{"name":"message","label":"Message","type":"textarea","required":false}]',
      welcomeMessage,
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
  if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, fields, welcomeMessage } = await req.json();
  if (!id) return NextResponse.json({ error: "Form ID is required" }, { status: 400 });

  const existingForm = await prisma.contactForm.findUnique({
    where: { id },
  });

  if (!existingForm || existingForm.workspaceId !== user.workspaceId) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const form = await prisma.contactForm.update({
    where: { id },
    data: {
      name,
      fields: fields ? JSON.stringify(fields) : undefined,
      welcomeMessage,
    },
  });

  return NextResponse.json({ form });
}
