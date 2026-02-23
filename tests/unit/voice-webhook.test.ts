import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/voice/webhook/route";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    voiceCall: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
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
    usageRecord: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/webhook-security", () => ({
  verifyWebhookSignature: vi.fn(() => true),
}));

vi.mock("@/lib/voice-compliance", () => ({
  normalizeVoicePhoneNumber: vi.fn((p) => p),
  normalizeVoiceStatus: vi.fn((s) => s?.toUpperCase?.() || s),
  parseVoiceMetadata: vi.fn((m) => m || {}),
  serializeVoiceMetadata: vi.fn((m) => JSON.stringify(m)),
  isAfterHours: vi.fn(() => false),
  detectFrustration: vi.fn(() => false),
  extractConsentDecision: vi.fn(() => ({ provided: false, granted: false, text: "", raw: "" })),
}));

vi.mock("@/lib/vapi", () => ({
  processVapiWebhook: vi.fn((e) => ({
    callId: e.call_id,
    status: e.status,
    action: e.type?.includes("ended") || e.type?.includes("completed") ? "end" :
      e.type?.includes("in-progress") ? "update" : "create",
  })),
}));

/**
 *
 */
function createMockRequest(body: Record<string, unknown>, signature?: string): NextRequest {
  const headers = new Headers();
  if (signature) headers.set("x-vapi-signature", signature);

  return new NextRequest("http://localhost/api/voice/webhook", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("Voice Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VAPI_WEBHOOK_SECRET = "";
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("POST", () => {
    it("should reject requests missing call_id", async () => {
      const req = createMockRequest({ type: "call.started" });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Missing call_id");
    });

    it("should accept valid webhook without signature when secret not configured", async () => {
      const req = createMockRequest({
        type: "call.started",
        call_id: "call-123",
        status: "ringing",
        metadata: { workspaceId: "ws-123" },
      });

      mockPrisma.voiceCall.upsert.mockResolvedValue({ id: "vc-123", callSid: "call-123" });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should reject requests with invalid signature when secret is configured", async () => {
      process.env.VAPI_WEBHOOK_SECRET = "test-secret";

      const { verifyWebhookSignature } = await import("@/lib/webhook-security");
      vi.mocked(verifyWebhookSignature).mockReturnValueOnce(false);

      const req = createMockRequest({ type: "call.started", call_id: "call-123" }, "invalid-sig");
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("should create voice call on call.started event", async () => {
      const req = createMockRequest({
        type: "call.started",
        call_id: "call-456",
        status: "ringing",
        direction: "inbound",
        metadata: { workspaceId: "ws-123", contactPhone: "+1234567890" },
      });

      mockPrisma.contact.findFirst.mockResolvedValue({ id: "contact-123" });
      mockPrisma.voiceCall.upsert.mockResolvedValue({ id: "vc-456", callSid: "call-456" });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.voiceCall.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { callSid: "call-456" },
        })
      );
    });

    it("should update voice call status on in-progress event", async () => {
      const req = createMockRequest({
        type: "call.in-progress",
        call_id: "call-789",
        status: "in-progress",
        metadata: { workspaceId: "ws-123" },
      });

      mockPrisma.voiceCall.updateMany.mockResolvedValue({ count: 1 });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockPrisma.voiceCall.updateMany).toHaveBeenCalled();
    });

    it("should handle call completion with transcript", async () => {
      const req = createMockRequest({
        type: "call.ended",
        call_id: "call-end-1",
        status: "completed",
        duration: 120,
        transcript: "Hello, I need an appointment",
        summary: "Appointment inquiry",
        metadata: { workspaceId: "ws-123" },
      });

      mockPrisma.voiceCall.findFirst.mockResolvedValue({
        id: "vc-end-1",
        metadata: "{}",
        workspaceId: "ws-123",
        direction: "INBOUND",
      });
      mockPrisma.voiceCall.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.alert.create.mockResolvedValue({ id: "alert-1" });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockPrisma.alert.create).toHaveBeenCalled();
    });

    it("should handle after-hours calls with alert", async () => {
      const { isAfterHours } = await import("@/lib/voice-compliance");
      vi.mocked(isAfterHours).mockReturnValueOnce(true);

      const req = createMockRequest({
        type: "call.started",
        call_id: "call-after-hours",
        status: "ringing",
        direction: "inbound",
        metadata: { workspaceId: "ws-123" },
      });

      mockPrisma.workspace.findUnique.mockResolvedValue({ timezone: "America/New_York" });
      mockPrisma.voiceCall.upsert.mockResolvedValue({ id: "vc-ah", callSid: "call-after-hours" });
      mockPrisma.alert.create.mockResolvedValue({ id: "alert-ah" });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  describe("GET", () => {
    it("should return health check response", async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(data.message).toContain("active");
      expect(data.timestamp).toBeDefined();
    });
  });
});
