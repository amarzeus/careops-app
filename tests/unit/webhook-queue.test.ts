import { describe, it, expect, vi, beforeEach } from "vitest";
import { enqueueWebhookJob, processWebhookJob, getPendingJobs } from "@/lib/webhook-queue";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    webhookJob: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    alert: {
      create: vi.fn(),
    },
    voiceCall: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("Webhook Queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("enqueueWebhookJob", () => {
    it("should create a new job with pending status", async () => {
      const mockJob = {
        id: "job-123",
        type: "voice_call_created",
        callId: "vc-123",
        callSid: "call-123",
        workspaceId: "ws-123",
        payload: "{}",
        metadata: "{}",
        status: "pending",
        retryCount: 0,
      };

      mockPrisma.webhookJob.create.mockResolvedValue(mockJob);

      const jobId = await enqueueWebhookJob({
        type: "voice_call_created",
        callId: "vc-123",
        callSid: "call-123",
        workspaceId: "ws-123",
        payload: { test: true },
      });

      expect(jobId).toBe("job-123");
      expect(mockPrisma.webhookJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "voice_call_created",
            status: "pending",
            retryCount: 0,
          }),
        })
      );
    });
  });

  describe("processWebhookJob", () => {
    it("should return error for non-existent job", async () => {
      mockPrisma.webhookJob.findUnique.mockResolvedValue(null);

      const result = await processWebhookJob("non-existent");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Job not found");
    });

    it("should process voice_call_created job successfully", async () => {
      const mockJob = {
        id: "job-456",
        type: "voice_call_created",
        callId: "vc-456",
        callSid: "call-456",
        workspaceId: "ws-456",
        payload: JSON.stringify({ test: true }),
        metadata: JSON.stringify({ afterHours: true }),
        status: "pending",
        retryCount: 0,
      };

      mockPrisma.webhookJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.webhookJob.update.mockResolvedValue({ ...mockJob, status: "processing" });
      mockPrisma.alert.create.mockResolvedValue({ id: "alert-123" });

      const result = await processWebhookJob("job-456");

      expect(result.success).toBe(true);
      expect(mockPrisma.alert.create).toHaveBeenCalled();
    });

    it("should handle job failure and increment retry count", async () => {
      const mockJob = {
        id: "job-fail",
        type: "voice_call_created",
        callId: "vc-fail",
        callSid: "call-fail",
        workspaceId: "ws-fail",
        payload: "invalid-json",
        metadata: "{}",
        status: "pending",
        retryCount: 0,
      };

      mockPrisma.webhookJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.webhookJob.update
        .mockResolvedValueOnce({ ...mockJob, status: "processing" })
        .mockResolvedValueOnce({ ...mockJob, status: "retrying", retryCount: 1 });

      const result = await processWebhookJob("job-fail");

      expect(result.success).toBe(false);
    });

    it("should mark job as failed after max retries", async () => {
      const mockJob = {
        id: "job-max-retry",
        type: "voice_call_created",
        callId: "vc-retry",
        callSid: "call-retry",
        workspaceId: "ws-retry",
        payload: "invalid-json",
        metadata: "{}",
        status: "retrying",
        retryCount: 3,
      };

      mockPrisma.webhookJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.webhookJob.update
        .mockResolvedValueOnce({ ...mockJob, status: "processing" })
        .mockResolvedValueOnce({ ...mockJob, status: "failed", retryCount: 4 });

      const result = await processWebhookJob("job-max-retry");

      expect(result.success).toBe(false);
    });
  });

  describe("getPendingJobs", () => {
    it("should return pending jobs within retry window", async () => {
      const mockJobs = [
        {
          id: "job-1",
          type: "voice_call_created",
          callId: "vc-1",
          callSid: "call-1",
          workspaceId: "ws-1",
          payload: "{}",
          metadata: "{}",
          status: "pending",
          retryCount: 0,
          createdAt: new Date(),
        },
      ];

      mockPrisma.webhookJob.findMany.mockResolvedValue(mockJobs);

      const jobs = await getPendingJobs(10);

      expect(jobs).toHaveLength(1);
      expect(jobs[0].callSid).toBe("call-1");
    });
  });
});
