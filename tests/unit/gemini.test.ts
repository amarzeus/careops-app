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
