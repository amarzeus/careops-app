import { describe, it, expect, vi, beforeEach } from "vitest";
import { logInventoryChange, InventoryLogData } from "@/lib/inventory-log";

// Mock Prisma
const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      inventoryLog: { create: vi.fn(), findMany: vi.fn() },
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("Inventory Log Utility (Strict Mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log inventory change successfully", async () => {
    const logData: InventoryLogData = {
      itemId: "item-1",
      previousQty: 10,
      newQty: 5,
      reason: "manual_adjustment",
      workspaceId: "ws-1",
    };

    await logInventoryChange(logData);

    expect(mockPrisma.inventoryLog.create).toHaveBeenCalledWith({
      data: {
        itemId: "item-1",
        previousQty: 10,
        newQty: 5,
        change: -5,
        reason: "manual_adjustment",
        referenceId: undefined,
        referenceType: undefined,
        workspaceId: "ws-1",
      },
    });
  });

  it("should handle database errors gracefully (no throw)", async () => {
    mockPrisma.inventoryLog.create.mockRejectedValue(new Error("DB Error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const logData: InventoryLogData = {
      itemId: "item-1",
      previousQty: 10,
      newQty: 15,
      reason: "restock",
      workspaceId: "ws-1",
    };

    // Should not throw
    await expect(logInventoryChange(logData)).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to log inventory change"),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
