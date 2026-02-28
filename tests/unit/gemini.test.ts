import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiOnboardingAssistant } from "@/lib/gemini";

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

describe("aiOnboardingAssistant (Function Calling)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle tool call for data update correctly", async () => {
    // Mock Tool Call response
    const mockArgs = { addInventoryItems: [{ name: "Gloves", quantity: "100" }] };

    mockGenerateContent.mockResolvedValue({
      text: "I've added those items for you.",
      functionCalls: [
        {
          name: "updateInventory",
          args: mockArgs,
        },
      ],
    });

    const result = await aiOnboardingAssistant(
      "Add 100 gloves",
      6,
      { workspace: { name: "My Dental Clinic" }, inventoryItems: [] },
      []
    );

    expect(mockGenerateContent).toHaveBeenCalled();
    expect(result.message).toBe("I've added those items for you.");
    expect(result.extractedData).toEqual(mockArgs);
    expect(result.shouldAdvance).toBe(true);
  });

  it("should handle navigation tool call correctly", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "Sure, let's go back.",
      functionCalls: [
        {
          name: "jumpToStep",
          args: { targetStep: 3, reason: "User request" },
        },
      ],
    });

    const result = await aiOnboardingAssistant("Go back to contact form", 6, {}, []);

    expect(result.navigationAction).toEqual({ type: "jump", targetStep: 3 });
    expect(result.extractedData).toBeNull();
  });

  it("should handle text-only response (no tool call)", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "What services do you offer?",
      functionCalls: undefined,
    });

    const result = await aiOnboardingAssistant("Hello", 4, {}, []);

    expect(result.message).toBe("What services do you offer?");
    expect(result.extractedData).toBeNull();
    expect(result.shouldAdvance).toBe(false);
  });

  it("should handle error gracefully", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API Error"));

    const result = await aiOnboardingAssistant("Hello", 1, {}, []);

    expect(result.message).toContain("hiccup");
    expect(result.extractedData).toBeNull();
  });
});

import { analyzeSentiment } from "@/lib/gemini";

describe("analyzeSentiment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return parsed sentiment on success", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ score: 90, label: "positive" }),
    });

    const result = await analyzeSentiment("I am very happy with the service!");

    expect(mockGenerateContent).toHaveBeenCalled();
    expect(result.score).toBe(90);
    expect(result.label).toBe("positive");
    expect(result.emoji).toBe("😊");
  });

  it("should use heuristic fallback for urgent keywords if API fails", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API Quota Error"));

    const result = await analyzeSentiment("This is an urgent emergency, help me ASAP!");

    expect(result.label).toBe("urgent");
    expect(result.emoji).toBe("🔴");
    expect(result.score).toBe(15);
  });

  it("should use heuristic fallback for negative keywords if API fails", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API Quota Error"));

    const result = await analyzeSentiment("This is terrible, I am very disappointed and angry.");

    expect(result.label).toBe("negative");
    expect(result.emoji).toBe("😞");
    expect(result.score).toBe(25);
  });

  it("should return neutral for short messages", async () => {
    const result = await analyzeSentiment("hi");

    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(result.label).toBe("neutral");
    expect(result.emoji).toBe("😐");
    expect(result.score).toBe(50);
  });
});
