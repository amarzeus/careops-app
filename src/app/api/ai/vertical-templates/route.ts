import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VERTICAL_TEMPLATES, getTemplateList, VerticalKey } from "@/lib/vertical-templates";

/**
 * GET /api/ai/vertical-templates
 * Returns a list of available industry templates
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ templates: getTemplateList() });
}

/**
 * POST /api/ai/vertical-templates
 * Applies a specific vertical template to the user's workspace.
 * Body: { templateKey: string }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow owners to apply templates
  if (user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspaceId = user.workspaceId;

  try {
    const { templateKey } = await req.json();

    if (!templateKey || !VERTICAL_TEMPLATES[templateKey as VerticalKey]) {
      return NextResponse.json({ error: "Invalid template key" }, { status: 400 });
    }

    const template = VERTICAL_TEMPLATES[templateKey as VerticalKey];

    // Transaction to insert all template data
    await prisma.$transaction(async (tx) => {
      // 1. Clear existing template data (optional, but good for "resetting" if they change mind during onboarding)
      // Note: We only delete if it's safe (no bookings tied to services, etc.),
      // but since this is usually done at onboarding, it should be empty anyway.
      const existingBookings = await tx.booking.count({ where: { workspaceId } });
      if (existingBookings > 0) {
        throw new Error(
          "Cannot apply template to a workspace with existing bookings. Please create a new workspace."
        );
      }

      await tx.service.deleteMany({ where: { workspaceId } });
      await tx.inventoryItem.deleteMany({ where: { workspaceId } });
      await tx.automationRule.deleteMany({ where: { workspaceId } });

      // 2. Insert Services
      if (template.services.length > 0) {
        await tx.service.createMany({
          data: template.services.map((s) => ({
            workspaceId,
            name: s.name,
            duration: s.duration,
            price: s.price,
            description: s.description,
          })),
        });
      }

      // 3. Insert Inventory
      if (template.inventoryItems.length > 0) {
        await tx.inventoryItem.createMany({
          data: template.inventoryItems.map((i) => ({
            workspaceId,
            name: i.name,
            quantity: i.quantity,
            threshold: i.threshold,
            unit: i.unit,
          })),
        });
      }

      // 4. Insert Automation Rules
      if (template.automationRules.length > 0) {
        await tx.automationRule.createMany({
          data: template.automationRules.map((a) => ({
            workspaceId,
            name: a.name,
            trigger: a.trigger,
            messageTemplate: a.messageTemplate,
            delayMinutes: a.delayMinutes,
            isActive: true,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Template "${template.name}" applied successfully!`,
    });
  } catch (error) {
    console.error("Template application error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to apply template" },
      { status: 500 }
    );
  }
}
