import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateWeeklyReport } from "@/lib/gemini";

const { mockGenerateContent } = vi.hoisted(() => {
  return {
    mockGenerateContent: vi.fn(),
  };
});

vi.mock("@google/genai", () => {
  return {
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
  };
});

describe("generateWeeklyReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    businessName: "Dentist Clinic",
    periodStart: "2026-02-21",
    periodEnd: "2026-02-28",
    bookingsTotal: 15,
    bookingsCompleted: 12,
    bookingsCancelled: 3,
    newContacts: 5,
    messagesReceived: 45,
    avgSentimentScore: 78,
    lowStockCount: 2,
    topServices: [{ name: "Dental Cleaning", count: 10 }],
    staffCount: 3,
  };

  it("should return a structured report when Gemini API succeeds", async () => {
    const mockReport = {
      summary: "A very productive week with high patient volume.",
      highlights: ["90% completion rate", "5 new patients"],
      concerns: ["3 cancellations"],
      recommendations: ["Follow up with cancelled appointments"],
      performanceScore: 85,
    };

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockReport),
    });

    const result = await generateWeeklyReport(mockData);

    expect(mockGenerateContent).toHaveBeenCalled();
    expect(result).toEqual(mockReport);
  });

  it("should return a fallback report when Gemini API fails", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API Error"));

    const result = await generateWeeklyReport(mockData);

    expect(result.summary).toContain("Dentist Clinic");
    expect(result.performanceScore).toBeGreaterThan(0);
    expect(result.highlights.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("should return a fallback report when Gemini returns invalid JSON", async () => {
    mockGenerateContent.mockResolvedValue({
      text: () => "Invalid JSON Response",
    });

    const result = await generateWeeklyReport(mockData);

    expect(result.summary).toContain("Dentist Clinic");
    expect(result.performanceScore).toBeGreaterThan(0);
  });
});
