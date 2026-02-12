import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const submission = await prisma.formSubmission.findUnique({
      where: { id },
    });

    if (!submission || submission.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.formSubmission.update({
      where: { id },
      data: {
        status: body.status || submission.status,
        completedAt: body.status === "COMPLETED" ? new Date() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
