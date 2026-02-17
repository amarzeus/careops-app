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

  const form = await prisma.contactForm.findFirst({
    where: {
      OR: [
        { slug: slug },
        { workspaceId: slug, isActive: true }
      ]
    },
    select: {
      id: true,
      name: true,
      fields: true,
      isActive: true,
      workspace: { select: { id: true, name: true } },
    },
  });

  if (!form) {
    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: slug },
      select: { id: true, name: true }
    });

    if (workspace) {
      // Return a default form structure
      return NextResponse.json({
        form: {
          id: "default",
          name: "Contact Us",
          fields: "[]", // Default fields handled by frontend
          isActive: true,
          workspace: workspace
        }
      });
    }

    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (!form.isActive)
    return NextResponse.json({ error: "Form not found" }, { status: 404 });

  return NextResponse.json({ form });
}
