import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractInventoryItemsFromImage } from '@/lib/gemini';

// Mock the GoogleGenAI client
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn(function () {
        return {
            models: {
                generateContent: mockGenerateContent,
            },
        };
    }),
    Type: {
        OBJECT: 'OBJECT',
        STRING: 'STRING',
        NUMBER: 'NUMBER',
        BOOLEAN: 'BOOLEAN',
        ARRAY: 'ARRAY',
    }
}));

describe('Multimodal Inventory Scanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extract inventory items from an image correctly', async () => {
        // Mock expected response data
        const mockInvoiceData = {
            invoiceNumber: "INV-2024-001",
            vendor: "Dental Supplies Co.",
            date: "2024-03-15",
            items: [
                { name: "Latex Gloves", quantity: 100, unitPrice: 10.50, total: 105.00 },
                { name: "Masks", quantity: 50, unitPrice: 5.00, total: 250.00 }
            ]
        };

        // Mock the SDK response
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(mockInvoiceData)
        });

        const imageBase64 = "base64encodedimagestring...";
        const result = await extractInventoryItemsFromImage(imageBase64);

        expect(mockGenerateContent).toHaveBeenCalledTimes(1);

        // Verify result matches mock data
        expect(result).toEqual(mockInvoiceData);
    });

    it('should handle API errors gracefully', async () => {
        mockGenerateContent.mockRejectedValue(new Error("API Error"));

        const result = await extractInventoryItemsFromImage("base64...");

        expect(result).toBeNull();
    });
});
