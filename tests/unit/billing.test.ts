/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/razorpay", () => ({
  getRazorpayInstance: vi.fn(),
  cancelRazorpaySubscription: vi.fn(),
}));

import { GET } from "@/app/api/billing/history/route";
import { POST } from "@/app/api/billing/cancel/route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayInstance, cancelRazorpaySubscription } from "@/lib/razorpay";

describe("Billing API Endpoints", () => {
  const mockUser = {
    id: "user-1",
    workspaceId: "workspace-1",
  };

  const mockSubscription = {
    id: "sub-1",
    workspaceId: "workspace-1",
    razorpaySubscriptionId: "rzp_sub_123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/billing/history", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null as any);

      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("returns empty history if no active subscription", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.history).toEqual([]);
    });

    it("fetches and formats invoice history from razorpay", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(mockSubscription as any);

      const mockInvoices = {
        items: [
          {
            id: "inv_123",
            amount: 50000,
            status: "paid",
            issued_at: 1714521600,
            short_url: "https://rzp.io/123",
          },
        ],
      };

      vi.mocked(getRazorpayInstance).mockReturnValueOnce({
        invoices: {
          all: vi.fn().mockResolvedValueOnce(mockInvoices),
        },
      } as unknown as ReturnType<typeof getRazorpayInstance>);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.history[0]).toEqual({
        id: "inv_123",
        amount: 500, // 50000 / 100
        status: "paid",
        date: new Date(1714521600 * 1000).toISOString(),
        invoiceUrl: "https://rzp.io/123",
      });
    });
  });

  describe("POST /api/billing/cancel", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null as any);

      const response = await POST();
      expect(response.status).toBe(401);
    });

    it("returns 400 if no active subscription to cancel", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);

      const response = await POST();
      expect(response.status).toBe(400);
    });

    it("cancels subscription via razorpay and updates database", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(mockSubscription as any);

      vi.mocked(cancelRazorpaySubscription).mockResolvedValueOnce(undefined);
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({
        ...mockSubscription,
        cancelAtPeriodEnd: true,
      } as any);

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(cancelRazorpaySubscription).toHaveBeenCalledWith("rzp_sub_123");
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { cancelAtPeriodEnd: true },
      });
      expect(body.subscription.cancelAtPeriodEnd).toBe(true);
    });
  });
});
