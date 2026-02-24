import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/voice/webhook/route";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    voiceCall: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    contact: {
      findFirst: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    alert: {
      create: vi.fn(),
    },
    callConsent: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/webhook-security", () => ({
  verifyWebhookSignature: vi.fn(() => true),
}));

// Mock trackUsage to avoid external dependencies
vi.mock("@/lib/razorpay-subscriptions", () => ({
  trackUsage: vi.fn(),
}));

function createMockRequest(body: Record<string, unknown>, signature = "test-sig"): NextRequest {
  const headers = new Headers();
  headers.set("x-vapi-signature", signature);

  return new NextRequest("http://localhost/api/voice/webhook", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("Voice Agent Regression (Gemini Logic)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Scenario: Returning Caller Detection", async () => {
    const payload = {
      type: "call.started",
      call_id: "returning-call-id",
      metadata: { workspaceId: "ws-123", contactPhone: "+1234567890" },
    };

    // Return an existing contact
    mockPrisma.contact.findFirst.mockResolvedValue({ id: "contact-123" });

    // Return an existing recent call from this contact
    mockPrisma.voiceCall.findFirst.mockResolvedValue({
      id: "prev-call-id",
      summary: "Previously asked about billing",
    });

    mockPrisma.voiceCall.upsert.mockResolvedValue({ id: "vc-1", metadata: "{}" });
    mockPrisma.voiceCall.update.mockResolvedValue({ id: "vc-1" });
    mockPrisma.workspace.findUnique.mockResolvedValue({ timezone: "UTC" });

    const res = await POST(createMockRequest(payload));
    expect(res.status).toBe(200);

    // Verify alert for returning caller was created
    expect(mockPrisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Returning caller detected",
          workspaceId: "ws-123",
        }),
      })
    );
  });

  it("Scenario: After-Hours Call Alerting", async () => {
    const payload = {
      type: "call.started",
      call_id: "ah-call-id",
      metadata: { workspaceId: "ws-123" },
      direction: "inbound",
    };

    mockPrisma.voiceCall.upsert.mockResolvedValue({ id: "vc-ah", metadata: "{}" });
    mockPrisma.workspace.findUnique.mockResolvedValue({ timezone: "UTC" });

    // Mock isAfterHours to return true (we happen to know it's a mock in the test env)
    const voiceComp = await import("@/lib/voice-compliance");
    vi.spyOn(voiceComp, "isAfterHours").mockReturnValue(true);

    const res = await POST(createMockRequest(payload));
    expect(res.status).toBe(200);

    expect(mockPrisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "After-hours call received",
        }),
      })
    );
  });

  it("Scenario: Frustrated Caller Escalation", async () => {
    const payload = {
      type: "call.ended",
      call_id: "frustrated-call-id",
      status: "completed",
      transcript: "This is useless! I want to speak to a person right now. Terrible service.",
      metadata: { workspaceId: "ws-123" },
    };

    mockPrisma.voiceCall.findFirst.mockResolvedValue({
      id: "vc-f",
      workspaceId: "ws-123",
      metadata: "{}",
    });
    mockPrisma.voiceCall.updateMany.mockResolvedValue({ count: 1 });

    const res = await POST(createMockRequest(payload));
    expect(res.status).toBe(200);

    // Verify escalation alert created
    expect(mockPrisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "voice_escalation",
          title: "Voice escalation needed",
        }),
      })
    );
  });

  it("Scenario: Recording Consent Decision tracking", async () => {
    const payload = {
      type: "call.ended",
      call_id: "consent-call-id",
      status: "completed",
      metadata: {
        workspaceId: "ws-123",
        consent: true,
        consentText: "May we record?",
      },
    };

    mockPrisma.voiceCall.findFirst.mockResolvedValue({
      id: "vc-c",
      workspaceId: "ws-123",
      metadata: "{}",
    });
    mockPrisma.voiceCall.updateMany.mockResolvedValue({ count: 1 });

    const res = await POST(createMockRequest(payload));
    expect(res.status).toBe(200);

    // Verify consent record created
    expect(mockPrisma.callConsent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          consentResponse: true,
        }),
      })
    );
  });
});
