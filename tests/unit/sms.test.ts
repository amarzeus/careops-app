import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendSMS } from "@/lib/sms";

// Mock Prisma
const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      integrationLog: { create: vi.fn() },
      alert: { create: vi.fn() },
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock Twilio Lib
vi.mock("@/lib/twilio", () => ({
  sendSMS: vi.fn(),
}));

import { sendSMS as mockTwilioSendSMS } from "@/lib/twilio";

describe("SMS Utility (Strict Mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send sms successfully and log success", async () => {
    (mockTwilioSendSMS as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      sid: "SM123",
    });

    const result = await sendSMS({
      to: "+15551234567",
      body: "Test SMS",
      workspaceId: "ws-1",
    });

    expect(result).toBe(true);
    expect(mockTwilioSendSMS).toHaveBeenCalledWith("+15551234567", "Test SMS");

    expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "sms",
        status: "success",
        to: "+15551234567",
        workspaceId: "ws-1",
      }),
    });
  });

  it("should log failure and create alert on INVALID_NUMBER", async () => {
    (mockTwilioSendSMS as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: "Invalid number",
      errorCode: "INVALID_NUMBER",
    });

    const result = await sendSMS({
      to: "invalid",
      body: "Test",
      workspaceId: "ws-error",
    });

    expect(result).toBe(false);

    // Verify Alert Title Specificity
    expect(mockPrisma.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Invalid Phone Number",
        workspaceId: "ws-error",
      }),
    });
  });

  it("should log failure and create alert on Generic Failure", async () => {
    (mockTwilioSendSMS as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: "Twilio Error",
      errorCode: "UNKNOWN",
    });

    const result = await sendSMS({
      to: "+15551234567",
      body: "Test",
      workspaceId: "ws-error",
    });

    expect(result).toBe(false);

    // Verify Alert Title
    expect(mockPrisma.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "SMS Delivery Failed",
        workspaceId: "ws-error",
      }),
    });
  });
});
