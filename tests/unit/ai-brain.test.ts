import { describe, it, expect, vi, beforeEach } from "vitest";

// ──────────────────────────────────────────────
// Mock setup (hoisted)
// ──────────────────────────────────────────────

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor() {}
    get models() {
      return {
        generateContent: mockGenerateContent,
      };
    }
  },
  Type: {
    STRING: "STRING",
    NUMBER: "NUMBER",
    INTEGER: "INTEGER",
    BOOLEAN: "BOOLEAN",
    ARRAY: "ARRAY",
    OBJECT: "OBJECT",
  },
}));

import { classifyConversationIntent, analyzeOperationsAnomalies, scoreContact } from "@/lib/gemini";

describe("AI Brain — Intent Classification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should classify a booking request correctly", async () => {
    const mockResult = {
      intent: "booking_request",
      confidence: 0.92,
      suggestedAction: "Send booking link",
      priority: "medium",
    };
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockResult),
    });

    const result = await classifyConversationIntent(
      "I want to schedule an appointment for next week"
    );
    expect(result.intent).toBe("booking_request");
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.priority).toBe("medium");
  });

  it("should classify a complaint as high priority", async () => {
    const mockResult = {
      intent: "complaint",
      confidence: 0.88,
      suggestedAction: "Escalate to manager",
      priority: "high",
    };
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockResult),
    });

    const result = await classifyConversationIntent("I had a terrible experience yesterday");
    expect(result.intent).toBe("complaint");
    expect(result.priority).toBe("high");
  });

  it("should include conversation history context", async () => {
    const mockResult = {
      intent: "follow_up",
      confidence: 0.75,
      suggestedAction: "Review prior conversation",
      priority: "low",
    };
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockResult),
    });

    const result = await classifyConversationIntent("Any updates on that?", [
      "Previous message 1",
      "Previous message 2",
    ]);
    expect(result.intent).toBe("follow_up");
    // Check if generateContent was called with history in the prompt
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.stringContaining("Conversation history"),
      })
    );
  });

  it("should return safe defaults on AI error", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "not valid JSON at all",
    });

    const result = await classifyConversationIntent("hello");
    expect(result.intent).toBe("general");
    expect(result.confidence).toBe(0.5);
    expect(result.priority).toBe("medium");
  });
});

describe("AI Brain — Anomaly Detection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should detect a no-show spike anomaly", async () => {
    const mockAnomalies = [
      {
        type: "no_show_spike",
        severity: "warning",
        description: "No-show rate is 3x higher than average",
        recommendation: "Send appointment reminders 24h before",
        metric: "noShowRate",
        expectedRange: "5-10%",
        actualValue: "30%",
      },
    ];
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ anomalies: mockAnomalies }),
    });

    const result = await analyzeOperationsAnomalies({
      bookingsThisWeek: 10,
      bookingsLastWeek: 12,
      noShowRate: 0.3,
      averageNoShowRate: 0.1,
      newContactsThisWeek: 5,
      newContactsLastWeek: 5,
      pendingForms: 2,
      overdueForms: 0,
      lowStockItems: 1,
      totalItems: 20,
      unansweredMessages: 3,
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("no_show_spike");
    expect(result[0].severity).toBe("warning");
  });

  it("should return empty array when operations are normal", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ anomalies: [] }),
    });

    const result = await analyzeOperationsAnomalies({
      bookingsThisWeek: 10,
      bookingsLastWeek: 10,
      noShowRate: 0.05,
      averageNoShowRate: 0.05,
      newContactsThisWeek: 5,
      newContactsLastWeek: 5,
      pendingForms: 0,
      overdueForms: 0,
      lowStockItems: 0,
      totalItems: 20,
      unansweredMessages: 0,
    });

    expect(result).toEqual([]);
  });

  it("should handle malformed AI response gracefully", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API quota exceeded"));

    // Implementation returns Busy info anomaly on quota error
    const result = await analyzeOperationsAnomalies({});
    expect(result).toEqual([
      {
        type: "info",
        severity: "info",
        description: "AI Analytics is currently at capacity. Standard metrics are still available.",
        recommendation: "Check back later for automated insights.",
        metric: "Status",
        expectedRange: "Optimal",
        actualValue: "Busy",
      },
    ]);
  });
});

describe("AI Brain — Contact Scoring", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should score a highly engaged contact as A grade", async () => {
    const mockScore = {
      score: 92,
      grade: "A",
      factors: [
        { factor: "booking_completion", impact: "positive", weight: 0.9 },
        { factor: "response_rate", impact: "positive", weight: 0.8 },
      ],
      summary: "Highly engaged patient with excellent booking history",
      nextBestAction: "Offer loyalty program",
    };
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockScore),
    });

    const result = await scoreContact({
      name: "Jane Doe",
      totalBookings: 12,
      completedBookings: 11,
      noShows: 0,
      cancelledBookings: 1,
      totalMessages: 20,
      formsCompleted: 3,
      formsPending: 0,
      daysSinceLastBooking: 5,
      daysSinceFirstContact: 180,
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.grade).toBe("A");
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it("should score a disengaged contact as D/F grade", async () => {
    const mockScore = {
      score: 15,
      grade: "F",
      factors: [{ factor: "no_shows", impact: "negative", weight: 0.9 }],
      summary: "Unreliable contact with frequent no-shows",
      nextBestAction: "Consider removing from active list",
    };
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockScore),
    });

    const result = await scoreContact({
      name: "Ghost Contact",
      totalBookings: 5,
      completedBookings: 1,
      noShows: 3,
      cancelledBookings: 1,
      totalMessages: 2,
      formsCompleted: 0,
      formsPending: 2,
      daysSinceLastBooking: 90,
      daysSinceFirstContact: 120,
    });

    expect(result.score).toBeLessThan(20);
    expect(result.grade).toBe("F");
  });

  it("should provide safe defaults when AI returns invalid JSON", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "totally not json at all!",
    });

    const result = await scoreContact({
      name: "Test",
      totalBookings: 0,
      completedBookings: 0,
      noShows: 0,
      cancelledBookings: 0,
      totalMessages: 0,
      formsCompleted: 0,
      formsPending: 0,
      daysSinceLastBooking: 0,
      daysSinceFirstContact: 0,
    });

    // Should use fallback defaults
    expect(result.score).toBe(50);
    expect(result.grade).toBe("C");
    expect(result.nextBestAction).toContain("Engage");
  });
});
