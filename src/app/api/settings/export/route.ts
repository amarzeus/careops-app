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

  const workspaceId = user.workspaceId;

  try {
    const [contacts, bookings, services, forms, submissions, inventory, automationRules] =
      await Promise.all([
        prisma.contact.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
        prisma.booking.findMany({
          where: { workspaceId },
          include: { service: true, contact: true },
          orderBy: { date: "desc" },
        }),
        prisma.service.findMany({ where: { workspaceId } }),
        prisma.contactForm.findMany({ where: { workspaceId } }),
        prisma.formSubmission.findMany({
          where: { workspaceId },
          include: { contact: true, intakeForm: true },
        }),
        prisma.inventoryItem.findMany({ where: { workspaceId } }),
        prisma.automationRule.findMany({ where: { workspaceId } }),
      ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      workspace: { id: workspaceId },
      contacts,
      bookings,
      services,
      forms,
      submissions,
      inventory,
      automationRules,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="careops-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
