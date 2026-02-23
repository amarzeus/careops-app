/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI, Type, type Part } from "@google/genai";
export { type Part };

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

// Lazy initialization to prevent build-time errors if env vars are missing
let clientInstance: GoogleGenAI | null = null;

/**
 * Retrieves the singleton GoogleGenAI client instance.
 * @returns The GoogleGenAI client
 */
export function getClient(): GoogleGenAI {
  if (!clientInstance) {
    if (!GEMINI_KEY && process.env.NODE_ENV !== "test") {
      console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
      // We don't throw here to avoid crashing the build if this is just a side-effect import
    }
    clientInstance = new GoogleGenAI({ apiKey: GEMINI_KEY });
  }
  return clientInstance;
}

// ──────────────────────────────────────────────
// Model Selection Helper
// ──────────────────────────────────────────────

/**
 * Available Gemini models with their display names.
 * Note: Gemini 2.0 Flash is deprecated and will be shut down June 1, 2026.
 */
export const GEMINI_MODELS = {
  "gemini-3.1-pro-preview": "Gemini 3.1 Pro (Latest - Reasoning)",
  "gemini-3-flash": "Gemini 3 Flash (Latest - Multimodal)",
  "gemini-2.5-pro": "Gemini 2.5 Pro (Advanced)",
  "gemini-2.5-flash": "Gemini 2.5 Flash (Fast)",
  "gemini-2.5-flash-lite": "Gemini 2.5 Flash-Lite (Cheapest)",
  "gemini-2.0-flash": "Gemini 2.0 Flash (Deprecated)",
} as const;

export type GeminiModelId = keyof typeof GEMINI_MODELS;

/**
 * Default model to use.
 */
export const DEFAULT_GEMINI_MODEL: GeminiModelId = "gemini-2.0-flash";

/**
 * Gets the AI model preference for a workspace.
 * @param workspaceId - The workspace ID
 * @returns The model ID to use
 */
export async function getWorkspaceGeminiModel(workspaceId: string): Promise<string> {
  // Dynamic import to avoid circular dependency
  const { prisma } = await import("./prisma");
  try {
    const prefs = await (
      prisma as any as {
        aIPreferences: { findUnique: (args: any) => Promise<{ geminiModel?: string }> };
      }
    ).aIPreferences.findUnique({
      where: { workspaceId },
      select: { geminiModel: true },
    });
    return prefs?.geminiModel || DEFAULT_GEMINI_MODEL;
  } catch {
    return DEFAULT_GEMINI_MODEL;
  }
}

// ──────────────────────────────────────────────
// Core AI Engine
// ──────────────────────────────────────────────

/**
 * Calls the Gemini AI model with a prompt and optional schema.
 * @param prompt - The prompt to send to the AI
 * @param responseSchema - Optional JSON schema for structured output
 * @param systemInstruction - Optional system instruction
 * @param model - Optional model ID to use
 * @returns The parsed JSON response
 */
// Helper to identify quota errors across the SDK
export function isQuotaError(error: any): boolean {
  if (!error) return false;
  const err = error as Record<string, any>;
  return (
    err.status === 429 ||
    err.statusCode === 429 ||
    (typeof err.message === "string" && err.message.toLowerCase().includes("quota")) ||
    (typeof err.message === "string" && err.message.toLowerCase().includes("rate limit")) ||
    (typeof err.message === "string" && err.message.toLowerCase().includes("429"))
  );
}

/**
 *
 */
async function callGemini<T>(
  prompt: string | (string | Part)[],
  responseSchema?: any,
  systemInstruction?: string,
  model?: string
): Promise<T> {
  try {
    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
    };

    if (responseSchema) {
      config.responseSchema = responseSchema;
    }

    const client = getClient();
    const response = await client.models.generateContent({
      model: model || DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        ...config,
        systemInstruction,
      },
    });

    const text = response.text;
    return JSON.parse(text!) as T;
  } catch (error: any) {
    if (isQuotaError(error)) {
      const quotaError = new Error("AI Quota Exceeded");
      (quotaError as { status?: number }).status = 429;
      throw quotaError;
    }
    throw error;
  }
}

// ──────────────────────────────────────────────
// 2. Booking Confirmation Message
// ──────────────────────────────────────────────

/**
 * Generates a booking confirmation message.
 * @param businessName - Name of the business
 * @param contactName - Name of the contact
 * @param serviceName - Name of the service booked
 * @param dateTime - Date and time of the booking
 * @param location - Optional location of the booking
 * @returns The generated confirmation message
 */
export async function generateBookingConfirmation(
  businessName: string,
  contactName: string,
  serviceName: string,
  dateTime: string,
  location?: string
): Promise<string> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      message: { type: Type.STRING, description: "The booking confirmation message" },
    },
    required: ["message"],
  };

  try {
    const result = await callGemini<{ message: string }>(
      `Generate a booking confirmation message from "${businessName}" to "${contactName}" for "${serviceName}" on ${dateTime}${location ? ` at ${location}` : ""}. Include key details and a professional tone. Keep it under 5 sentences.`,
      schema
    );
    return result.message;
  } catch {
    return `Your appointment for ${serviceName} has been confirmed for ${dateTime}${location ? ` at ${location}` : ""}. We look forward to seeing you, ${contactName}! - ${businessName}`;
  }
}

// ──────────────────────────────────────────────
// 3. Smart Reply V2 (Context-Aware)
// ──────────────────────────────────────────────

/**
 * Generates smart reply suggestions based on conversation history.
 * @param businessName - Name of the business
 * @param conversationHistory - Recent conversation history
 * @param lastMessage - The last message received from the customer
 * @returns Array of smart reply suggestions
 */
export async function generateSmartReply(
  businessName: string,
  conversationHistory: string,
  lastMessage: string,
  model?: string
): Promise<string[]> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      replies: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of 3 smart reply options",
      },
    },
    required: ["replies"],
  };

  const systemPrompt = `You are an AI assistant for "${businessName}". You generate professional reply suggestions.
RULES:
- Each reply should be 1-2 sentences, professional, and contextually relevant.
- Tone: Helpful, warm, and efficient. Avoid overly formal or robotic language.
- If the customer asks about scheduling, mention booking availability.
- If the customer has a complaint, be empathetic and solution-oriented.
- If the customer asks about forms, guide them to complete required documents.
- Use the business name naturally if appropriate.`;

  try {
    const result = await callGemini<{ replies: string[] }>(
      `Conversation history:\n${conversationHistory}\n\nLatest message from customer: "${lastMessage}"\n\nGenerate 3 professional reply options.`,
      schema,
      systemPrompt,
      model
    );
    return result.replies.slice(0, 3);
  } catch (error) {
    if (isQuotaError(error)) {
      // Return specific indicator or standard fallbacks
      return [
        "The AI is briefly busy. Please type your reply.",
        "System at capacity. Manual reply recommended.",
        "Check back in a moment for smart suggestions.",
      ];
    }
    return [
      "Thank you for reaching out. I'd be happy to help with that.",
      "I appreciate your message. Let me look into this for you right away.",
      "Thanks for contacting us. Could you provide a few more details so I can assist you better?",
    ];
  }
}

// ──────────────────────────────────────────────
// 4. Dashboard Insights (Enhanced)
// ──────────────────────────────────────────────

/**
 * Generates actionable insights based on business metrics.
 * @param data - The business metrics data
 * @returns Array of prioritized insights
 */
export async function generateDashboardInsights(
  data: {
    totalBookings: number;
    completedBookings: number;
    newContacts: number;
    pendingForms: number;
    lowStockItems: number;
    unreadMessages: number;
  },
  model?: string
): Promise<
  Array<{ priority: "high" | "medium" | "low"; category: string; message: string; action: string }>
> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      insights: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
            category: { type: Type.STRING },
            message: { type: Type.STRING },
            action: { type: Type.STRING },
          },
          required: ["priority", "category", "message", "action"],
        },
      },
    },
    required: ["insights"],
  };

  const systemPrompt = `You are CareOps AI, a top-tier business operations analyst. Based on metrics, provide brief, high-impact, actionable insights.
RULES:
- Provide exactly 3 insights.
- Insights MUST be specific and actionable (e.g., "Call 3 leads", not "Follow up with leads").
- Prioritize:
  1. Critical issues (unread messages, low stock, pending forms).
  2. Revenue opportunities (pending bookings, new leads).
  3. Operational optimizations.
- Keep messages punchy and under 15 words.`;

  try {
    const result = await callGemini<{
      insights: Array<{
        priority: "high" | "medium" | "low";
        category: string;
        message: string;
        action: string;
      }>;
    }>(
      `Business metrics:
- Total bookings: ${data.totalBookings}
- Completed bookings: ${data.completedBookings}
- New contacts this week: ${data.newContacts}
- Pending forms: ${data.pendingForms}
- Low stock items: ${data.lowStockItems}
- Unread messages: ${data.unreadMessages}`,
      schema,
      systemPrompt,
      model
    );
    return result.insights.slice(0, 3); // Ensure only 3 insights are returned as per prompt
  } catch {
    const insights: Array<{
      priority: "high" | "medium" | "low";
      category: string;
      message: string;
      action: string;
    }> = [];
    if (data.unreadMessages > 0)
      insights.push({
        priority: "high",
        category: "Communication",
        message: `${data.unreadMessages} messages need your attention`,
        action: "Open Inbox",
      });
    if (data.pendingForms > 0)
      insights.push({
        priority: "medium",
        category: "Operations",
        message: `${data.pendingForms} forms waiting for completion`,
        action: "Review Forms",
      });
    if (data.lowStockItems > 0)
      insights.push({
        priority: "high",
        category: "Inventory",
        message: `${data.lowStockItems} items running low`,
        action: "Check Inventory",
      });
    if (insights.length === 0)
      insights.push({
        priority: "low",
        category: "System",
        message: "All operations running smoothly",
        action: "View Dashboard",
      });
    return insights;
  }
}

// ──────────────────────────────────────────────
// 5. Message Refinement
// ──────────────────────────────────────────────

/**
 * Refines a message to match a specific tone.
 * @param content - The original message content
 * @param tone - The desired tone (default: professional)
 * @returns The refined message
 */
export async function refineMessage(
  content: string,
  tone: string = "professional",
  model?: string
): Promise<string> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      refinedMessage: { type: Type.STRING },
    },
    required: ["refinedMessage"],
  };

  try {
    const result = await callGemini<{ refinedMessage: string }>(
      `Refine this message to be more ${tone}, polite, and professional. Keep the original meaning but make it sound world-class.
Original: "${content}"`,
      schema,
      model
    );
    return result.refinedMessage;
  } catch (error) {
    if (isQuotaError(error)) {
      return `${content} (AI limit reached - refinement unavailable)`;
    }
    return content;
  }
}

// ──────────────────────────────────────────────
// 6. Inventory Forecast
// ──────────────────────────────────────────────

/**
 * Generates an inventory forecast based on current stock levels.
 * @param items - Array of inventory items with usage data
 * @returns Array of forecast objects
 */
export async function generateInventoryForecast(
  items: Array<{ name: string; quantity: number; threshold: number; unit: string }>,
  model?: string
): Promise<Array<{ name: string; daysRemaining: number | string; confidence: string }>> {
  if (items.length === 0) return [];

  const schema = {
    type: Type.OBJECT,
    properties: {
      forecasts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            daysRemaining: {
              type: Type.STRING,
              description: "Estimated days remaining or 'Critical'",
            },
            confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
          },
          required: ["name", "daysRemaining", "confidence"],
        },
      },
    },
    required: ["forecasts"],
  };

  try {
    const result = await callGemini<{
      forecasts: Array<{
        name: string;
        daysRemaining: string;
        confidence: "high" | "medium" | "low";
      }>;
    }>(
      `You are an inventory specialist. Based on current stock and thresholds, estimate days of stock remaining for each item. Items at or below threshold typically have 3-5 days left. Zero quantity means "Critical".
Items: ${JSON.stringify(items)}`,
      schema,
      undefined,
      model
    );
    return result.forecasts;
  } catch (error) {
    const fallback = items.map((i) => ({
      name: i.name,
      daysRemaining:
        i.quantity === 0
          ? "Critical"
          : Math.max(1, Math.floor((i.quantity / Math.max(1, i.threshold)) * 5)),
      confidence: "low" as const,
    }));

    if (isQuotaError(error)) {
      return fallback.map((f) => ({ ...f, daysRemaining: `${f.daysRemaining} (Est.)` }));
    }
    return fallback;
  }
}

// ──────────────────────────────────────────────
// 7. Operations Summary
// ──────────────────────────────────────────────

/**
 * Generates a summary of daily operations.
 * @param data - The daily operations data
 * @returns A concise summary string
 */
export async function generateOperationsSummary(
  data: {
    bookingsToday: number;
    bookingsCompleted: number;
    bookingsNoShow: number;
    newContacts: number;
    unansweredMessages: number;
    pendingForms: number;
    lowStockItems: number;
    businessName: string;
  },
  model?: string
): Promise<string> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
    },
    required: ["summary"],
  };

  try {
    const result = await callGemini<{ summary: string }>(
      `Generate a concise operations summary for "${data.businessName}" in 3-4 sentences. Be specific with the numbers. Highlight what needs attention. End with one actionable recommendation.
Today's Data:
- Bookings today: ${data.bookingsToday}
- Completed: ${data.bookingsCompleted}  
- No-shows: ${data.bookingsNoShow}
- New contacts: ${data.newContacts}
- Unanswered messages: ${data.unansweredMessages}
- Pending forms: ${data.pendingForms}
- Low stock items: ${data.lowStockItems}`,
      schema,
      model
    );
    return result.summary;
  } catch (error) {
    if (isQuotaError(error)) {
      return `[AI BUSY] Today you have ${data.bookingsToday} bookings scheduled. ${data.unansweredMessages > 0 ? `${data.unansweredMessages} messages need attention. ` : ""}${data.lowStockItems > 0 ? `${data.lowStockItems} inventory items are running low. ` : ""}Please check your dashboard for full details.`;
    }
    return `Today you have ${data.bookingsToday} bookings scheduled. ${data.unansweredMessages > 0 ? `${data.unansweredMessages} messages need attention. ` : ""}${data.lowStockItems > 0 ? `${data.lowStockItems} inventory items are running low. ` : ""}Keep operations running smoothly by staying on top of your inbox.`;
  }
}

// ──────────────────────────────────────────────
// 8. AI Message Composer
// ──────────────────────────────────────────────

/**
 * Composes a new message based on intent and context.
 * @param intent - The intent of the message (e.g., "confirm booking")
 * @param context - Contextual information for the message
 * @returns The composed message
 */
export async function composeMessage(
  intent: string,
  context: {
    businessName: string;
    contactName?: string;
    serviceName?: string;
    dateTime?: string;
  }
): Promise<string> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      message: { type: Type.STRING },
    },
    required: ["message"],
  };

  try {
    const result = await callGemini<{ message: string }>(
      `You are a professional message composer for "${context.businessName}". 
Write a message based on this intent: "${intent}"
${context.contactName ? `Contact: ${context.contactName}` : ""}
${context.serviceName ? `Service: ${context.serviceName}` : ""}
${context.dateTime ? `Date/Time: ${context.dateTime}` : ""}

Keep it professional, warm, and under 4 sentences.`,
      schema
    );
    return result.message;
  } catch (error) {
    if (isQuotaError(error)) {
      return `Hi${context.contactName ? ` ${context.contactName}` : ""}, the AI is currently busy. Please type your message manually or try again in a moment.`;
    }
    return `Hi${context.contactName ? ` ${context.contactName}` : ""}, regarding your ${intent.toLowerCase()} — our team at ${context.businessName} will follow up shortly.`;
  }
}

// ──────────────────────────────────────────────
// 9. Onboarding Assistant (Agentic with Tools)
// ──────────────────────────────────────────────

export type AIOnboardingResponse = {
  message: string;
  extractedData: Record<string, unknown> | null;
  shouldAdvance: boolean;
  navigationAction: { type: "jump"; targetStep: number } | null;
};

// Tool Definitions
const onboardingTools = [
  {
    functionDeclarations: [
      {
        name: "updateWorkspace",
        description: "Update workspace details (Step 1)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            address: { type: Type.STRING },
            timezone: { type: Type.STRING },
            contactEmail: { type: Type.STRING },
            contactPhone: { type: Type.STRING },
          },
        },
      },
      {
        name: "updateCommunicationConfig",
        description: "Update email and SMS configuration (Step 2)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            emailFromName: { type: Type.STRING },
            emailFromAddress: { type: Type.STRING },
            emailConfigured: { type: Type.BOOLEAN },
          },
        },
      },
      {
        name: "updateContactForm",
        description: "Update contact form settings (Step 3)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            formName: { type: Type.STRING },
            welcomeMessage: { type: Type.STRING },
          },
        },
      },
      {
        name: "updateServices",
        description: "Add, update, or remove services (Step 4)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            addServices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                },
              },
            },
            updateServices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { id: { type: Type.STRING }, name: { type: Type.STRING } },
              },
            },
            removeServices: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
      {
        name: "updateIntakeForms",
        description: "Manage intake forms (Step 5)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            addIntakeForms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  fields: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
            updateIntakeForms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { id: { type: Type.STRING }, name: { type: Type.STRING } },
              },
            },
            removeIntakeForms: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
      {
        name: "updateInventory",
        description: "Manage inventory items (Step 6)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            addInventoryItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  threshold: { type: Type.NUMBER },
                },
              },
            },
            updateInventoryItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { id: { type: Type.STRING }, quantity: { type: Type.NUMBER } },
              },
            },
            removeInventoryItems: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
      {
        name: "updateStaff",
        description: "Manage staff members (Step 7)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            addStaffMember: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                email: { type: Type.STRING },
              },
            },
            updateStaffMember: {
              type: Type.OBJECT,
              properties: { id: { type: Type.STRING }, role: { type: Type.STRING } },
            },
            removeStaffMember: { type: Type.STRING },
          },
        },
      },
      {
        name: "jumpToStep",
        description: "Navigate to a specific onboarding step",
        parameters: {
          type: Type.OBJECT,
          properties: {
            targetStep: { type: Type.NUMBER },
            reason: { type: Type.STRING },
          },
          required: ["targetStep"],
        },
      },
    ],
  },
];

// Helper for step status building (preserved from original)
/**
 * Builds a status string for the current onboarding step.
 * @param step - Current step number
 * @param info - Business information object
 * @returns Formatted status string
 */
function buildStepStatus(step: number, info: Record<string, unknown>): string {
  const ws = (info.workspace || {}) as Record<string, unknown>;
  const email = (info.emailConfig || {}) as Record<string, unknown>;
  const cf = (info.contactForm || {}) as Record<string, unknown>;
  const svcs = (info.services || []) as Array<any>;
  const forms = (info.intakeForms || []) as Array<any>;
  const inv = (info.inventoryItems || []) as Array<any>;
  const staff = (info.staffMembers || []) as Array<any>;

  // ... (Identical logic for business type detection) ...
  const nameLower = String(ws.name || "").toLowerCase();
  let businessType = "service business";
  if (/dent/i.test(nameLower)) businessType = "dental clinic";
  else if (/salon|barber|beauty|hair|spa/i.test(nameLower)) businessType = "salon/spa";
  // ... (rest of logic) ...

  switch (step) {
    case 1:
      return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Workspace fields:\n${JSON.stringify(ws, null, 2)}`;
    case 2:
      return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Email/SMS fields:\n${JSON.stringify(email, null, 2)}`;
    case 3:
      return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Contact Form:\n${JSON.stringify(cf, null, 2)}`;
    case 4:
      return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Services/Bookings:\nEXISTING SERVICES:\n${JSON.stringify(svcs, null, 2)}`;
    case 5:
      return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Intake Forms:\nEXISTING FORMS:\n${JSON.stringify(forms, null, 2)}`;
    case 6:
      return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Inventory:\nEXISTING ITEMS:\n${JSON.stringify(inv, null, 2)}`;
    case 7:
      return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Staff:\nEXISTING STAFF:\n${JSON.stringify(staff, null, 2)}`;
    case 8:
      return `BUSINESS TYPE: ${businessType}\nACTIVATION CHECKLIST:\n${JSON.stringify({ ws, email, cf, serviceCount: svcs.length, formCount: forms.length, invCount: inv.length, staffCount: staff.length }, null, 2)}`;
    default:
      return JSON.stringify(info, null, 2);
  }
}

// Helper to sanitize history for Gemini SDK
/**
 * Sanitizes conversation history for the Gemini API.
 * @param history - Array of message objects
 * @returns Array of formatted Content objects
 */
function sanitizeGeminiHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>
): Array<{ role: "user" | "model"; parts: [{ text: string }] }> {
  // Simple mapping for now, ensuring roles are correct
  return history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
}

/**
 * AI Agent for handling the onboarding process.
 * @param userMessage - The user's input message
 * @param currentStep - Current step in the onboarding flow
 * @param businessInfo - Current collected business information
 * @param conversationHistory - History of the conversation
 * @returns Object containing the AI's response and any actions taken
 */
export async function aiOnboardingAssistant(
  userMessage: string,
  currentStep: number,
  businessInfo: Record<string, unknown>,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  model: string = DEFAULT_GEMINI_MODEL
): Promise<AIOnboardingResponse> {
  const stepStatus = buildStepStatus(currentStep, businessInfo);

  const systemPrompt = `You are CareOps AI — a proactive, agentic onboarding concierge.
CURRENT STEP: ${currentStep} of 8.
STEP STATUS: ${stepStatus}
BEHAVIOR RULES:
1. Focus on Step ${currentStep}.
2. Use the available tools to update business information based on the user's input.
3. If the user provides information relevant to the current step, CALL THE APPROPRIATE TOOL.
4. If the user wants to jump to another step, usage 'jumpToStep'.
5. Always provide a helpful response message along with any tool calls.
6. Return a natural text response if no tool is needed.`;

  try {
    const geminiHistory = sanitizeGeminiHistory(conversationHistory);

    const contents = [...geminiHistory, { role: "user", parts: [{ text: userMessage }] }];

    const client = getClient();
    // We do NOT use responseSchema when using tools, as the model needs flexibility to call tools or just talk.
    // Instead, we inspect the response for function calls.
    const response = await client.models.generateContent({
      model: model || DEFAULT_GEMINI_MODEL,
      config: {
        systemInstruction: systemPrompt,

        tools: onboardingTools as any,
      },

      contents: contents as any,
    });

    const text = response.text || ""; // Text might be empty if only a tool call is made, but usually Gemini explains itself.

    // Extract function calls from the candidates
    const functionCalls = response.functionCalls;

    // Map function calls to the legacy `extractedData` structure
    let extractedData: Record<string, unknown> | null = null;
    let navigationAction: { type: "jump"; targetStep: number } | null = null;
    let shouldAdvance = false;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]; // Handle the primary tool call
      const args = call.args || {};

      if (call.name === "jumpToStep") {
        navigationAction = { type: "jump", targetStep: Number(args.targetStep) };
      } else {
        // For data update tools, the args map directly to extractedData
        extractedData = args as Record<string, unknown>;

        // Auto-advance logic: if a data update tool was called successfully, we can likely advance
        // But let's be conservative: only advance if the model didn't explicitly ask a follow-up in text.
        // For this implementation, we'll assume yes if data was extracted, matching previous behavior.
        shouldAdvance = true;
      }
    }

    // Default message if the model called a tool but didn't speak (rare for Gemini 2.0 but possible)
    let message = text;
    if (!message && extractedData) {
      message = "I've updated that for you.";
    } else if (!message) {
      message = "I'm listening.";
    }

    return {
      message,
      extractedData,
      shouldAdvance,
      navigationAction,
    };
  } catch (err: any) {
    console.error("AI Onboarding Error:", err);

    let message = "I had a small hiccup processing that. Could you try again?";
    if (isQuotaError(err)) {
      message =
        "The AI Assistant is currently experiencing high volume (quota reached). Please continue by filling out the form manually while I take a quick break!";
    }

    return {
      message,
      extractedData: null,
      shouldAdvance: false,
      navigationAction: null,
    };
  }
}

// ──────────────────────────────────────────────
// SOTA AI Brain: Intent Classification
// ──────────────────────────────────────────────

export interface ConversationIntent {
  intent:
    | "inquiry"
    | "complaint"
    | "booking_request"
    | "urgent"
    | "general"
    | "follow_up"
    | "cancellation";
  confidence: number;
  suggestedAction: string;
  priority: "high" | "medium" | "low";
}

/**
 * Classifies the intent of a customer message.
 * @param messageContent - The message text
 * @param conversationHistory - Optional recent conversation history
 * @returns Classified intent object
 */
export async function classifyConversationIntent(
  messageContent: string,
  conversationHistory?: string[],
  model?: string
): Promise<ConversationIntent> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      intent: {
        type: Type.STRING,
        enum: [
          "inquiry",
          "complaint",
          "booking_request",
          "urgent",
          "general",
          "follow_up",
          "cancellation",
        ],
      },
      confidence: { type: Type.NUMBER },
      suggestedAction: { type: Type.STRING },
      priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
    },
    required: ["intent", "confidence", "suggestedAction", "priority"],
  };

  const historyContext = conversationHistory?.length
    ? `\nConversation history (last ${conversationHistory.length} messages):\n${conversationHistory.join("\n")}`
    : "";

  try {
    return await callGemini<ConversationIntent>(
      `Classify the intent of this customer message for a service-based business.
Message: "${messageContent}"
${historyContext}`,
      schema,
      "You are an NLP intent classifier. Be precise.",
      model
    );
  } catch (error: any) {
    console.error("Intent classification error:", error);
    // The calling route/function should handle the isQuotaError and return appropriate HTTP response
    // This function should return a fallback object matching its interface
    return {
      intent: "general",
      confidence: 0.5,
      suggestedAction: "Review and respond",
      priority: "medium",
    };
  }
}

// ──────────────────────────────────────────────
// SOTA AI Brain: Operations Anomaly Detection
// ──────────────────────────────────────────────

export interface OperationsAnomaly {
  type: string;
  severity: "critical" | "warning" | "info";
  description: string;
  recommendation: string;
  metric: string;
  expectedRange: string;
  actualValue: string;
}

/**
 * Analyzes operational metrics for anomalies.
 * @param metrics - The metrics data object
 * @returns Array of detected anomalies
 */

/**
 *
 */
export async function analyzeOperationsAnomalies(
  metrics: any,
  model?: string
): Promise<OperationsAnomaly[]> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      anomalies: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ["critical", "warning", "info"] },
            description: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            metric: { type: Type.STRING },
            expectedRange: { type: Type.STRING },
            actualValue: { type: Type.STRING },
          },
          required: [
            "type",
            "severity",
            "description",
            "recommendation",
            "metric",
            "expectedRange",
            "actualValue",
          ],
        },
      },
    },
    required: ["anomalies"],
  };

  try {
    const result = await callGemini<{ anomalies: OperationsAnomaly[] }>(
      `Analyze these business operations metrics and identify anomalies.
Metrics: ${JSON.stringify(metrics, null, 2)}
Only flag genuine anomalies.`,
      schema,
      "You are an operations intelligence analyst.",
      model
    );
    return result.anomalies;
  } catch (error) {
    if (isQuotaError(error)) {
      return [
        {
          type: "info",
          severity: "info",
          description:
            "AI Analytics is currently at capacity. Standard metrics are still available.",
          recommendation: "Check back later for automated insights.",
          metric: "Status",
          expectedRange: "Optimal",
          actualValue: "Busy",
        },
      ];
    }
    return [];
  }
}

// ──────────────────────────────────────────────
// SOTA AI Brain: Lead/Contact Scoring
// ──────────────────────────────────────────────

export interface ContactScore {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  factors: { factor: string; impact: "positive" | "negative" | "neutral"; weight: number }[];
  summary: string;
  nextBestAction: string;
}

/**
 * Scores a contact or lead based on their data.
 * @param contactData - The contact's data
 * @returns Detailed contact score object
 */

/**
 *
 */
export async function scoreContact(contactData: any): Promise<ContactScore> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      grade: { type: Type.STRING, enum: ["A", "B", "C", "D", "F"] },
      factors: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            factor: { type: Type.STRING },
            impact: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
            weight: { type: Type.NUMBER },
          },
          required: ["factor", "impact", "weight"],
        },
      },
      summary: { type: Type.STRING },
      nextBestAction: { type: Type.STRING },
    },
    required: ["score", "grade", "factors", "summary", "nextBestAction"],
  };

  try {
    return await callGemini<ContactScore>(
      `Score this contact/lead for a service-based business.
Data: ${JSON.stringify(contactData, null, 2)}`,
      schema,
      "You are a CRM lead scoring expert."
    );
  } catch (error) {
    if (isQuotaError(error)) {
      return {
        score: 0,
        grade: "F",
        factors: [{ factor: "AI System at Capacity", impact: "neutral", weight: 0 }],
        summary: "Lead scoring is temporarily at capacity. Please review manually.",
        nextBestAction: "Review contact profiles directly.",
      };
    }
    return {
      score: 50,
      grade: "C",
      factors: [],
      summary: "Insufficient data for scoring",
      nextBestAction: "Engage with this contact to learn more",
    };
  }
}

// ──────────────────────────────────────────────
// 10. Multimodal Inventory Scanner
// ──────────────────────────────────────────────

export interface ScannedInvoice {
  invoiceNumber: string;
  vendor: string;
  date: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
}

/**
 * Extracts inventory items from an invoice image.
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - MIME type of the image
 * @returns Extracted invoice data or null if failed
 */
export async function extractInventoryItemsFromImage(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  model: string = DEFAULT_GEMINI_MODEL
): Promise<ScannedInvoice | null> {
  const schema = {
    properties: {
      invoiceNumber: { type: Type.STRING },
      vendor: { type: Type.STRING },
      date: { type: Type.STRING },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unitPrice: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
          },
          required: ["name", "quantity", "unitPrice", "total"],
        },
      },
    },
    required: ["invoiceNumber", "vendor", "date", "items"],
  };

  try {
    const client = getClient();
    const response = await client.models.generateContent({
      model: model || DEFAULT_GEMINI_MODEL,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction:
          "You are an expert data extraction AI. Extract inventory items from the invoice image.",
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            {
              text: "Extract inventory items from this invoice image. Return JSON data including invoice number, vendor, date, and a list of items with quantity and price.",
            },
          ],
        },
      ],
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as ScannedInvoice;
  } catch (error: any) {
    console.error("Multimodal Inventory Scan Error:", error);
    if (isQuotaError(error)) {
      const quotaError = new Error("AI Quota Exceeded");
      (quotaError as any).status = 429;
      throw quotaError;
    }
    return null;
  }
}

// ──────────────────────────────────────────────
// Welcome Message Generator
// ──────────────────────────────────────────────

/**
 * Generates a welcome message for a new contact.
 * @param businessName - Name of the business
 * @param contactName - Name of the contact
 * @returns The generated welcome message
 */
export async function generateWelcomeMessage(
  businessName: string,
  contactName: string
): Promise<string> {
  return `Welcome to ${businessName}, ${contactName}! We're excited to have you. How can we help you today?`;
}
