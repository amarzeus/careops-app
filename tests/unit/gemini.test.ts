import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiOnboardingAssistant } from '@/lib/gemini';

const { mockSendMessage, mockStartChat, mockGenerateContent } = vi.hoisted(() => {
    return {
        mockSendMessage: vi.fn(),
        mockStartChat: vi.fn(),
        mockGenerateContent: vi.fn(),
    };
});

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            getGenerativeModel() {
                return {
                    startChat: mockStartChat,
                    generateContent: mockGenerateContent,
                };
            }
        }
    };
});


describe('aiOnboardingAssistant', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStartChat.mockReturnValue({
            sendMessage: mockSendMessage,
        });
    });

    it('should handle proactive greeting for Step 6 correctly', async () => {
        // Mock AI response
        const mockResponse = {
            message: "Since you run a dental clinic, let's add gloves.",
            extractedData: { addInventoryItems: [{ name: "Gloves", quantity: "100" }] },
            shouldAdvance: false
        };

        mockSendMessage.mockResolvedValue({
            response: {
                text: () => JSON.stringify(mockResponse)
            }
        });

        const result = await aiOnboardingAssistant(
            "__GREETING__",
            6,
            { workspace: { name: "My Dental Clinic" }, inventoryItems: [] },
            []
        );

        expect(mockStartChat).toHaveBeenCalled();
        expect(mockSendMessage).toHaveBeenCalledWith(
            expect.stringContaining("I just arrived on this step")
        );
        expect(result.message).toBe(mockResponse.message);
        expect(result.extractedData).toEqual(mockResponse.extractedData);
    });

    it('should handle JSON parsing errors gracefully', async () => {
        mockSendMessage.mockResolvedValue({
            response: {
                text: () => "I'm sorry, I broke." // Not JSON
            }
        });

        const result = await aiOnboardingAssistant(
            "Hello",
            1,
            {},
            []
        );

        expect(result.message).toBe("I'm sorry, I broke.");
        expect(result.extractedData).toBeNull();
    });
});
