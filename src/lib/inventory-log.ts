/**
 * Inventory Audit Log Utility
 * Tracks all inventory changes for audit purposes
 */

import { prisma } from "./prisma";

export type InventoryChangeReason = 
  | "booking_completed" 
  | "manual_adjustment" 
  | "restock" 
  | "initial"
  | "booking_cancelled";

export interface InventoryLogData {
  itemId: string;
  previousQty: number;
  newQty: number;
  reason: InventoryChangeReason;
  referenceId?: string;
  referenceType?: string;
  workspaceId: string;
}

/**
 * Log an inventory change
 * @param data - Inventory log data
 */
export async function logInventoryChange(data: InventoryLogData): Promise<void> {
  try {
    await prisma.inventoryLog.create({
      data: {
        itemId: data.itemId,
        previousQty: data.previousQty,
        newQty: data.newQty,
        change: data.newQty - data.previousQty,
        reason: data.reason,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        workspaceId: data.workspaceId,
      },
    });
  } catch (error) {
    console.error("[InventoryLog] Failed to log inventory change:", error);
    // Don't throw - logging should not break the main flow
  }
}

/**
 * Get inventory change history for an item
 * @param itemId - Inventory item ID
 * @param limit - Number of records to return
 * @returns Array of inventory log entries
 */
export async function getInventoryHistory(
  itemId: string, 
  limit: number = 50
) {
  return prisma.inventoryLog.findMany({
    where: { itemId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get recent inventory changes for a workspace
 * @param workspaceId - Workspace ID
 * @param limit - Number of records to return
 * @returns Array of inventory log entries with item details
 */
export async function getWorkspaceInventoryHistory(
  workspaceId: string,
  limit: number = 50
) {
  return prisma.inventoryLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      item: {
        select: {
          name: true,
          unit: true,
        },
      },
    },
  });
}