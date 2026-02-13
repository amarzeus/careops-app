import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== "OWNER" && !user.canAccessForms)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const submissions = await prisma.formSubmission.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      intakeForm: true,
      contact: true,
      booking: { include: { service: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ submissions });
}
