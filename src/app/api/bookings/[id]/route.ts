import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updateBookingCalendarEvent,
  cancelBookingCalendarEvent,
} from "@/lib/google-calendar";
import { triggerAutomation } from "@/lib/automation";
import { logInventoryChange } from "@/lib/inventory-log";

/**
 *
 */
async function decrementInventoryForBooking(bookingId: string, workspaceId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: {
        include: {
          inventoryLinks: {
            include: { inventory: true },
          },
        },
      },
    },
  });

  if (!booking || booking.status === "COMPLETED") return;

  for (const link of booking.service.inventoryLinks) {
    const item = link.inventory;
    const previousQuantity = item.quantity;
    const newQuantity = Math.max(0, item.quantity - link.quantity);

    // Update inventory quantity
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: newQuantity },
    });

    // Log the inventory change
    await logInventoryChange({
      itemId: item.id,
      previousQty: previousQuantity,
      newQty: newQuantity,
      reason: "booking_completed",
      referenceId: bookingId,
      referenceType: "booking",
      workspaceId,
    });

    if (newQuantity <= item.threshold) {
      await triggerAutomation(workspaceId, "INVENTORY_LOW", {
        item: {
          name: item.name,
          quantity: newQuantity,
          threshold: item.threshold,
          unit: item.unit,
          vendorEmail: item.vendorEmail,
        },
      });
    }
  }
}

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  const booking = await prisma.booking.update({
    where: { id, workspaceId: user.workspaceId },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.serviceId && { serviceId: data.serviceId }),
    },
    include: { service: true, contact: true },
  });

  // Handle inventory decrement and calendar sync
  if (data.status === "COMPLETED") {
    decrementInventoryForBooking(id, user.workspaceId).catch((err) =>
      console.error("[Inventory] Decrement error:", err)
    );
  }

  // Sync calendar event updates (fire-and-forget)
  if (data.status === "CANCELLED" || data.status === "NO_SHOW") {
    cancelBookingCalendarEvent(id, user.workspaceId).catch((err) =>
      console.error("[Google Calendar] Cancel event error:", err)
    );
  } else if (data.date || data.serviceId) {
    updateBookingCalendarEvent(id, user.workspaceId).catch((err) =>
      console.error("[Google Calendar] Update event error:", err)
    );
  }

  return NextResponse.json({ booking });
}

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.booking.update({
    where: { id, workspaceId: user.workspaceId },
    data: { status: "CANCELLED" },
  });

  // Cancel the Google Calendar event (fire-and-forget)
  cancelBookingCalendarEvent(id, user.workspaceId).catch((err) =>
    console.error("[Google Calendar] Cancel event error:", err)
  );

  return NextResponse.json({ success: true });
}
