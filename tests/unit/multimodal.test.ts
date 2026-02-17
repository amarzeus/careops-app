import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractInventoryItemsFromImage } from '../../src/lib/gemini';
import { GoogleGenAI } from '@google/genai';

// Mock the GoogleGenAI client
const { mockGenerateContent } = vi.hoisted(() => {
    return { mockGenerateContent: vi.fn() };
});

vi.mock('@google/genai', async () => {
    return {
        GoogleGenAI: vi.fn(function () {
            return {
                models: {
                    generateContent: mockGenerateContent
                }
            };
        }),
        Type: {
            STRING: 'STRING',
            NUMBER: 'NUMBER',
            INTEGER: 'INTEGER',
            BOOLEAN: 'BOOLEAN',
            ARRAY: 'ARRAY',
            OBJECT: 'OBJECT'
        }
    };
});

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

        // Verify that the call arguments included the inlineData (image)
        const callArgs = mockGenerateContent.mock.calls[0][0];
        expect(callArgs.contents[0].parts[0].inlineData.data).toBe(imageBase64);
        expect(callArgs.contents[0].parts[0].inlineData.mimeType).toBe("image/jpeg");

        // Verify result matches mock data
        expect(result).toEqual(mockInvoiceData);
    });

    it('should handle API errors gracefully', async () => {
        mockGenerateContent.mockRejectedValue(new Error("API Error"));

        const result = await extractInventoryItemsFromImage("base64...");

        expect(result).toBeNull();
    });
});
