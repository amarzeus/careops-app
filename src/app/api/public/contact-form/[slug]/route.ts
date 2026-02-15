import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const form = await prisma.contactForm.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      fields: true,
      isActive: true,
      workspace: { select: { id: true, name: true } },
    },
  });

  if (!form || !form.isActive)
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  return NextResponse.json({ form });
}
