import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeRule } from "@/lib/automation";

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const rule = await prisma.automationRule.findUnique({
      where: { id, workspaceId: user.workspaceId },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: user.workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Find a test contact or create one
    let testContact = await prisma.contact.findFirst({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: "desc" },
    });

    if (!testContact) {
      // Create a temporary test contact if none exists
      testContact = await prisma.contact.create({
        data: {
          name: "Test User",
          email: user.email, // Send test email to the user themselves
          phone: user.phone || "+15550000000",
          workspaceId: user.workspaceId,
        },
      });
    }

    // Construct dummy data based on trigger type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {
      contact: {
        id: testContact.id,
        name: testContact.name,
        email: testContact.email,
        phone: testContact.phone,
      },
    };

    if (rule.trigger === "BOOKING_CREATED" || rule.trigger === "BEFORE_BOOKING") {
      // Find a booking or use dummy data
      const booking = await prisma.booking.findFirst({
        where: { workspaceId: user.workspaceId },
        include: { service: true },
      });

      if (booking) {
        data.booking = { id: booking.id, date: booking.date };
        data.service = {
          id: booking.serviceId,
          name: booking.service.name,
          location: booking.service.locationName,
        };
      } else {
        // Fallback dummy data
        data.booking = { id: "test-booking", date: new Date() };
        data.service = { id: "test-service", name: "Test Service", location: "Main Office" };
      }
    } else if (rule.trigger === "INVENTORY_LOW") {
      const item = await prisma.inventoryItem.findFirst({
        where: { workspaceId: user.workspaceId },
      });
      if (item) {
        data.item = {
          name: item.name,
          quantity: item.quantity,
          threshold: item.threshold,
          unit: item.unit,
          vendorEmail: item.vendorEmail,
        };
      } else {
        data.item = {
          name: "Test Item",
          quantity: 5,
          threshold: 10,
          unit: "boxes",
          vendorEmail: user.email, // Send to user for test
        };
      }
    } else if (rule.trigger === "FORM_PENDING") {
      data.form = { name: "Intake Form" };
    }

    // Execute the rule immediately (bypassing delay for testing purposes)
    // We modify the rule object passed to executeRule to force immediate execution if we wanted,
    // but executeRule logic respects delayMinutes.
    // For testing, we might want to override delay.
    // However, executeRule takes the rule object directly.
    // Let's copy the rule and set delay to 0 for the test.

    const testRule = { ...rule, delayMinutes: 0 };

    await executeRule(testRule, workspace, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Automation test error:", error);
    return NextResponse.json({ error: "Failed to test rule" }, { status: 500 });
  }
}
