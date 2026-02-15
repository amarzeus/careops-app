import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildEmailTemplate } from "@/lib/email";

/** POST /api/automation/vendor-alert
 *  Sends a reorder email to the vendor of a low-stock inventory item.
 *  PRD: "When inventory is low, automatically notify vendor for restocking"
 * @param req
 */
export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await req.json();
    if (!itemId) {
        return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.findFirst({
        where: { id: itemId, workspaceId: user.workspaceId },
    });

    if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!item.vendorEmail) {
        return NextResponse.json({ error: "No vendor email configured for this item" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: user.workspaceId },
    });

    const businessName = workspace?.name || "CareOps Business";

    const emailSent = await sendEmail({
        to: item.vendorEmail,
        subject: `Reorder Request: ${item.name} — ${businessName}`,
        html: buildEmailTemplate(
            "Inventory Reorder Request",
            `<p>Hello${item.vendorName ? ` ${item.vendorName}` : ""},</p>
       <p>This is an automated reorder request from <strong>${businessName}</strong>.</p>
       <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #fcd34d; margin: 16px 0;">
         <p style="margin: 0; font-weight: bold; color: #92400e;">📦 ${item.name}</p>
         <p style="margin: 4px 0 0; color: #92400e;">Current stock: <strong>${item.quantity} ${item.unit}</strong> (Threshold: ${item.threshold})</p>
       </div>
       <p>Please arrange a restock at your earliest convenience.</p>
       <p style="color: #6b7280; font-size: 12px;">This is an automated message from CareOps inventory management.</p>`,
            undefined,
            undefined
        ),
    });

    if (!emailSent) {
        return NextResponse.json({ error: "Failed to send vendor email" }, { status: 500 });
    }

    // Log the automation execution
    const vendorRule = await prisma.automationRule.findFirst({
        where: { workspaceId: user.workspaceId, trigger: "INVENTORY_LOW" },
    });

    if (vendorRule) {
        await prisma.automationLog.create({
            data: {
                ruleId: vendorRule.id,
                trigger: "INVENTORY_LOW",
                status: "SUCCESS",
                details: JSON.stringify({ itemId: item.id, itemName: item.name, vendorEmail: item.vendorEmail }),
                recipient: item.vendorEmail,
            },
        });

        // Also create a dashboard alert for the staff
        await prisma.alert.create({
            data: {
                type: "automation",
                title: "Vendor Notified",
                message: `Automated reorder sent to ${item.vendorName || item.vendorEmail} for ${item.name}`,
                actionUrl: "/inventory",
                workspaceId: user.workspaceId,
            },
        });
    }

    return NextResponse.json({ message: "Vendor notified successfully" });
}
