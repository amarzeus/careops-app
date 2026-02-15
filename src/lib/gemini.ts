import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_KEY && process.env.NODE_ENV !== "test") {
  console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// ──────────────────────────────────────────────
// Core AI Engine
// ──────────────────────────────────────────────

async function callGemini(prompt: string, systemInstruction?: string, jsonMode = false): Promise<string> {
  try {
    const config: Record<string, unknown> = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (jsonMode) config.generationConfig = { responseMimeType: "application/json" };

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", ...config });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini AI error:", error);
    throw new Error("AI processing failed");
  }
}

function parseJSON<T>(text: string, fallback: T): T {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    return match ? JSON.parse(match[0]) : fallback;
  } catch {
    return fallback;
  }
}

// ──────────────────────────────────────────────
// 1. Welcome Message Generation
// ──────────────────────────────────────────────

/**
 *
 * @param businessName
 * @param contactName
 */
export async function generateWelcomeMessage(businessName: string, contactName: string): Promise<string> {
  try {
    return await callGemini(
      `Generate a warm, professional welcome message from "${businessName}" to a new contact named "${contactName}". Keep it under 3 sentences. Be friendly but professional. Don't use emojis. Just return the message text, nothing else.`
    );
  } catch {
    return `Welcome to ${businessName}, ${contactName}! We're glad you reached out. Our team will be in touch shortly.`;
  }
}

// ──────────────────────────────────────────────
// 2. Booking Confirmation
// ──────────────────────────────────────────────

/**
 *
 * @param businessName
 * @param contactName
 * @param serviceName
 * @param dateTime
 * @param location
 */
export async function generateBookingConfirmation(
  businessName: string,
  contactName: string,
  serviceName: string,
  dateTime: string,
  location?: string
): Promise<string> {
  try {
    return await callGemini(
      `Generate a booking confirmation message from "${businessName}" to "${contactName}" for "${serviceName}" on ${dateTime}${location ? ` at ${location}` : ""}. Include key details and a professional tone. Keep it under 5 sentences. Just return the message text.`
    );
  } catch {
    return `Your appointment for ${serviceName} has been confirmed for ${dateTime}${location ? ` at ${location}` : ""}. We look forward to seeing you, ${contactName}! - ${businessName}`;
  }
}

// ──────────────────────────────────────────────
// 3. Smart Reply V2 (Context-Aware)
// ──────────────────────────────────────────────

/**
 *
 * @param businessName
 * @param conversationHistory
 * @param lastMessage
 */
export async function generateSmartReply(
  businessName: string,
  conversationHistory: string,
  lastMessage: string
): Promise<string[]> {
  const systemPrompt = `You are an AI assistant for "${businessName}". You generate professional reply suggestions.

RULES:
- Each reply should be 1-2 sentences, professional, and contextually relevant.
- Tone: Helpful, warm, and efficient. Avoid overly formal or robotic language.
- If the customer asks about scheduling, mention booking availability.
- If the customer has a complaint, be empathetic and solution-oriented.
- If the customer asks about forms, guide them to complete required documents.
- Use the business name naturally if appropriate.
- Return ONLY a JSON array of exactly 3 strings.`;

  try {
    const response = await callGemini(
      `Conversation history:\n${conversationHistory}\n\nLatest message from customer: "${lastMessage}"\n\nGenerate 3 professional reply options as a JSON array of strings.`,
      systemPrompt,
      true
    );
    const parsed = parseJSON<string[]>(response, []);
    if (parsed.length >= 3) return parsed.slice(0, 3);
    throw new Error("Insufficient replies");
  } catch {
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
 *
 * @param data
 * @param data.totalBookings
 * @param data.completedBookings
 * @param data.newContacts
 * @param data.pendingForms
 * @param data.lowStockItems
 * @param data.unreadMessages
 */
export async function generateDashboardInsights(data: {
  totalBookings: number;
  completedBookings: number;
  newContacts: number;
  pendingForms: number;
  lowStockItems: number;
  unreadMessages: number;
}): Promise<Array<{ priority: "high" | "medium" | "low"; category: string; message: string; action: string }>> {
  const systemPrompt = `You are CareOps AI, a top-tier business operations analyst. Based on metrics, provide brief, high-impact, actionable insights.

RULES:
- Provide exactly 3 insights.
- Insights MUST be specific and actionable (e.g., "Call 3 leads", not "Follow up with leads").
- Prioritize: 
  1. Critical issues (unread messages, low stock, pending forms).
  2. Revenue opportunities (pending bookings, new leads).
  3. Operational optimizations.
- Keep messages punchy and under 15 words.
- Return ONLY a JSON array.`;

  try {
    const response = await callGemini(
      `Business metrics:
- Total bookings: ${data.totalBookings}
- Completed bookings: ${data.completedBookings}
- New contacts this week: ${data.newContacts}
- Pending forms: ${data.pendingForms}
- Low stock items: ${data.lowStockItems}
- Unread messages: ${data.unreadMessages}

Return ONLY a JSON array of objects with: "priority" ("high"/"medium"/"low"), "category" (string), "message" (string), "action" (string).`,
      systemPrompt,
      true
    );
    const parsed = parseJSON<Array<{ priority: "high" | "medium" | "low"; category: string; message: string; action: string }>>(response, []);
    if (parsed.length > 0) return parsed.slice(0, 5);
    throw new Error("Empty insights");
  } catch {
    const insights: Array<{ priority: "high" | "medium" | "low"; category: string; message: string; action: string }> = [];
    if (data.unreadMessages > 0) insights.push({ priority: "high", category: "Communication", message: `${data.unreadMessages} messages need your attention`, action: "Open Inbox" });
    if (data.pendingForms > 0) insights.push({ priority: "medium", category: "Operations", message: `${data.pendingForms} forms waiting for completion`, action: "Review Forms" });
    if (data.lowStockItems > 0) insights.push({ priority: "high", category: "Inventory", message: `${data.lowStockItems} items running low`, action: "Check Inventory" });
    if (insights.length === 0) insights.push({ priority: "low", category: "System", message: "All operations running smoothly", action: "View Dashboard" });
    return insights;
  }
}

// ──────────────────────────────────────────────
// 5. Message Refinement
// ──────────────────────────────────────────────

/**
 *
 * @param content
 * @param tone
 */
export async function refineMessage(content: string, tone: string = "professional"): Promise<string> {
  try {
    return await callGemini(
      `Refine this message to be more ${tone}, polite, and professional. Keep the original meaning but make it sound world-class. Only return the refined text, nothing else.\n\nOriginal: "${content}"`
    );
  } catch {
    return content;
  }
}

// ──────────────────────────────────────────────
// 6. Inventory Forecast
// ──────────────────────────────────────────────

/**
 *
 * @param items
 */
export async function generateInventoryForecast(
  items: Array<{ name: string; quantity: number; threshold: number; unit: string }>
): Promise<Array<{ name: string; daysRemaining: number | string; confidence: string }>> {
  if (items.length === 0) return [];

  try {
    const response = await callGemini(
      `You are an inventory specialist. Based on current stock and thresholds, estimate days of stock remaining for each item. Items at or below threshold typically have 3-5 days left. Zero quantity means "Critical".

Items: ${JSON.stringify(items)}

Return ONLY a JSON array of objects with: "name" (string), "daysRemaining" (number or "Critical"), "confidence" ("high"/"medium"/"low").`,
      undefined,
      true
    );
    return parseJSON(response, []);
  } catch {
    return items.map(i => ({
      name: i.name,
      daysRemaining: i.quantity === 0 ? "Critical" : Math.max(1, Math.floor(i.quantity / Math.max(1, i.threshold) * 5)),
      confidence: "low",
    }));
  }
}

// ──────────────────────────────────────────────
// 7. Operations Summary (NEW - SOTA Feature)
// ──────────────────────────────────────────────

/**
 *
 * @param data
 * @param data.bookingsToday
 * @param data.bookingsCompleted
 * @param data.bookingsNoShow
 * @param data.newContacts
 * @param data.unansweredMessages
 * @param data.pendingForms
 * @param data.lowStockItems
 * @param data.businessName
 */
export async function generateOperationsSummary(data: {
  bookingsToday: number;
  bookingsCompleted: number;
  bookingsNoShow: number;
  newContacts: number;
  unansweredMessages: number;
  pendingForms: number;
  lowStockItems: number;
  businessName: string;
}): Promise<string> {
  try {
    return await callGemini(
      `Generate a concise operations summary for "${data.businessName}" in 3-4 sentences. Be specific with the numbers. Highlight what needs attention. End with one actionable recommendation.

Today's Data:
- Bookings today: ${data.bookingsToday}
- Completed: ${data.bookingsCompleted}  
- No-shows: ${data.bookingsNoShow}
- New contacts: ${data.newContacts}
- Unanswered messages: ${data.unansweredMessages}
- Pending forms: ${data.pendingForms}
- Low stock items: ${data.lowStockItems}

Return only the summary text.`
    );
  } catch {
    return `Today you have ${data.bookingsToday} bookings scheduled. ${data.unansweredMessages > 0 ? `${data.unansweredMessages} messages need attention. ` : ""}${data.lowStockItems > 0 ? `${data.lowStockItems} inventory items are running low. ` : ""}Keep operations running smoothly by staying on top of your inbox.`;
  }
}

// ──────────────────────────────────────────────
// 8. AI Message Composer (NEW - SOTA Feature)
// ──────────────────────────────────────────────

/**
 *
 * @param intent
 * @param context
 * @param context.businessName
 * @param context.contactName
 * @param context.serviceName
 * @param context.dateTime
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
  try {
    return await callGemini(
      `You are a professional message composer for "${context.businessName}". 
      
Write a message based on this intent: "${intent}"
${context.contactName ? `Contact: ${context.contactName}` : ""}
${context.serviceName ? `Service: ${context.serviceName}` : ""}
${context.dateTime ? `Date/Time: ${context.dateTime}` : ""}

Keep it professional, warm, and under 4 sentences. Return only the message text.`
    );
  } catch {
    return `Hi${context.contactName ? ` ${context.contactName}` : ""}, regarding your ${intent.toLowerCase()} — our team at ${context.businessName} will follow up shortly.`;
  }
}

// ──────────────────────────────────────────────
// 9. Onboarding Assistant (Preserved + Enhanced)
// ──────────────────────────────────────────────

function buildStepStatus(step: number, info: Record<string, unknown>): string {
  const ws = (info.workspace || {}) as Record<string, unknown>;
  const email = (info.emailConfig || {}) as Record<string, unknown>;
  const cf = (info.contactForm || {}) as Record<string, unknown>;
  const svcs = (info.services || []) as Array<unknown>;
  const forms = (info.intakeForms || []) as Array<unknown>;
  const inv = (info.inventoryItems || []) as Array<unknown>;
  const staff = (info.staffMembers || []) as Array<unknown>;

  const nameLower = (String(ws.name || "")).toLowerCase();
  let businessType = "service business";
  if (/dent/i.test(nameLower)) businessType = "dental clinic";
  else if (/salon|barber|beauty|hair|spa/i.test(nameLower)) businessType = "salon/spa";
  else if (/fitness|gym|yoga|pilat/i.test(nameLower)) businessType = "fitness studio";
  else if (/clinic|medical|health|doctor|physic/i.test(nameLower)) businessType = "medical practice";
  else if (/consult|coach|advis/i.test(nameLower)) businessType = "consulting firm";
  else if (/law|legal|attorney/i.test(nameLower)) businessType = "law practice";
  else if (/vet|animal|pet/i.test(nameLower)) businessType = "veterinary clinic";
  else if (/thera|counsel/i.test(nameLower)) businessType = "therapy practice";

  switch (step) {
    case 1: return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Workspace fields:\n${JSON.stringify(ws, null, 2)}`;
    case 2: return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Email/SMS fields:\n${JSON.stringify(email, null, 2)}`;
    case 3: return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Contact Form:\n${JSON.stringify(cf, null, 2)}`;
    case 4: return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Services/Bookings:\nEXISTING SERVICES:\n${JSON.stringify(svcs, null, 2)}`;
    case 5: return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Intake Forms:\nEXISTING FORMS:\n${JSON.stringify(forms, null, 2)}`;
    case 6: return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Inventory:\nEXISTING ITEMS:\n${JSON.stringify(inv, null, 2)}`;
    case 7: return `BUSINESS TYPE: ${businessType}\nTHIS STEP — Staff:\nEXISTING STAFF:\n${JSON.stringify(staff, null, 2)}`;
    case 8: return `BUSINESS TYPE: ${businessType}\nACTIVATION CHECKLIST:\n${JSON.stringify({ ws, email, cf, serviceCount: svcs.length, formCount: forms.length, invCount: inv.length, staffCount: staff.length }, null, 2)}`;
    default: return JSON.stringify(info, null, 2);
  }
}

function sanitizeGeminiHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>
): Array<{ role: "user" | "model"; parts: [{ text: string }] }> {
  let msgs = history.filter(m => m.content && m.content.trim());
  while (msgs.length > 0 && msgs[msgs.length - 1].role === "user") {
    msgs = msgs.slice(0, -1);
  }
  if (msgs.length === 0) return [];

  const merged: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const msg of msgs) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += "\n" + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  if (merged.length > 0 && merged[0].role === "assistant") {
    merged.unshift({ role: "user", content: "Hello, I'm setting up my business." });
  }
  if (merged.length > 0 && merged[merged.length - 1].role === "user") {
    merged.pop();
  }

  return merged.map(m => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));
}

/**
 *
 * @param userMessage
 * @param currentStep
 * @param businessInfo
 * @param conversationHistory
 */
export async function aiOnboardingAssistant(
  userMessage: string,
  currentStep: number,
  businessInfo: Record<string, unknown>,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<{ message: string; extractedData: Record<string, unknown> | null; shouldAdvance: boolean; navigationAction: { type: "jump"; targetStep: number } | null }> {
  const stepSchemas: Record<number, { title: string; schema: string }> = {
    1: { title: "Workspace Setup", schema: '{ "name": "...", "address": "...", "timezone": "...", "contactEmail": "...", "contactPhone": "..." }' },
    2: { title: "Email & SMS", schema: '{ "emailFromName": "...", "emailFromAddress": "...", "emailConfigured": true }' },
    3: { title: "Contact Form", schema: '{ "formName": "...", "welcomeMessage": "..." }' },
    4: { title: "Bookings / Services", schema: '{ "addServices": [{ "name": "...", "duration": "30", "location": "...", "startTime": "09:00", "endTime": "17:00" }], "updateServices": [...], "removeServices": ["Exact Name"] }' },
    5: { title: "Intake Forms", schema: '{ "addIntakeForms": [{ "name": "...", "description": "...", "fields": "[]" }], "updateIntakeForms": [...], "removeIntakeForms": ["Exact Name"] }' },
    6: { title: "Inventory", schema: '{ "addInventoryItems": [{ "name": "...", "quantity": "...", "threshold": "...", "unit": "..." }], "updateInventoryItems": [...], "removeInventoryItems": ["Exact Name"] }' },
    7: { title: "Staff", schema: '{ "addStaffMember": { "name": "...", "email": "...", "role": "STAFF" }, "updateStaffMember": { "email": "...", ... }, "removeStaffMember": "email@address.com" }' },
    8: { title: "Activate", schema: "null" },
  };

  const stepInfo = stepSchemas[currentStep] || { title: "Unknown", schema: "null" };
  const stepStatus = buildStepStatus(currentStep, businessInfo);
  const isGreeting = userMessage.startsWith("__GREETING__");
  const actualMessage = isGreeting ? "I just arrived on this step. Give me a proactive greeting." : userMessage;

  const systemPrompt = `You are CareOps AI — a proactive onboarding concierge.

═══════════════════════════════════════════
  CURRENT STEP: ${currentStep} of 8 — "${stepInfo.title}"
═══════════════════════════════════════════

## STEP STATUS:
${stepStatus}

## BEHAVIOR RULES:
1. Focus on Step ${currentStep}. Exception: if user asks to go back, return navigationAction.
2. IF GREETING: Ask a direct question for the first empty field. For list steps (4-8), suggest items based on business type.
3. IF ONGOING: Acknowledge briefly, then immediately ask for the next missing field.
4. Extract ALL provided data into extractedData.
5. If user says "yes" or "use defaults", generate full configuration.
6. Return ONLY JSON. No markdown. No text outside JSON.

## EXTRACTION SCHEMA for Step ${currentStep}:
${stepInfo.schema}

## JSON FORMAT:
{
  "message": "max 2 sentences",
  "extractedData": <schema or null>,
  "shouldAdvance": false,
  "navigationAction": null or { "type": "jump", "targetStep": <number> }
}

## STEP MAP:
1: Workspace  2: Communication  3: Contact Form  4: Bookings  5: Intake Forms  6: Inventory  7: Staff  8: Activate`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      generationConfig: { responseMimeType: "application/json" },
    });

    const geminiHistory = sanitizeGeminiHistory(conversationHistory);
    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(actualMessage);
    const text = result.response.text();

    const parsed = parseJSON<Record<string, unknown>>(text, {});
    const parsedMessage = typeof parsed.message === "string" && parsed.message.trim().length > 0
      ? parsed.message
      : text.trim();
    return {
      message: parsedMessage || "Let me help you with that.",
      extractedData: (parsed.extractedData as Record<string, unknown>) || null,
      shouldAdvance: Boolean(parsed.shouldAdvance),
      navigationAction: (parsed.navigationAction as { type: "jump"; targetStep: number }) || null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("AI Onboarding Error:", msg);
    return {
      message: "I had a small hiccup processing that. Could you try again?",
      extractedData: null,
      shouldAdvance: false,
      navigationAction: null,
    };
  }
}

export type AIOnboardingResponse = {
  message: string;
  extractedData: Record<string, unknown> | null;
  shouldAdvance: boolean;
  navigationAction: { type: "jump"; targetStep: number } | null;
};

// ──────────────────────────────────────────────
// SOTA AI Brain: Intent Classification
// ──────────────────────────────────────────────

export interface ConversationIntent {
  intent: "inquiry" | "complaint" | "booking_request" | "urgent" | "general" | "follow_up" | "cancellation";
  confidence: number;
  suggestedAction: string;
  priority: "high" | "medium" | "low";
}

/**
 *
 * @param messageContent
 * @param conversationHistory
 */
export async function classifyConversationIntent(
  messageContent: string,
  conversationHistory?: string[]
): Promise<ConversationIntent> {
  const historyContext = conversationHistory?.length
    ? `\nConversation history (last ${conversationHistory.length} messages):\n${conversationHistory.join("\n")}`
    : "";

  const prompt = `Classify the intent of this customer message for a service-based business.

Message: "${messageContent}"
${historyContext}

Respond in JSON with:
{
  "intent": one of: "inquiry", "complaint", "booking_request", "urgent", "general", "follow_up", "cancellation",
  "confidence": 0.0-1.0,
  "suggestedAction": brief suggestion for staff (max 50 chars),
  "priority": "high" (urgent/complaint), "medium" (booking/inquiry), "low" (general/follow_up)
}`;

  const text = await callGemini(prompt, "You are an NLP intent classifier for a healthcare/service business inbox. Be precise and concise.", true);
  return parseJSON<ConversationIntent>(text, {
    intent: "general",
    confidence: 0.5,
    suggestedAction: "Review and respond",
    priority: "medium",
  });
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
 *
 * @param metrics
 * @param metrics.bookingsThisWeek
 * @param metrics.bookingsLastWeek
 * @param metrics.noShowRate
 * @param metrics.averageNoShowRate
 * @param metrics.newContactsThisWeek
 * @param metrics.newContactsLastWeek
 * @param metrics.pendingForms
 * @param metrics.overdueForms
 * @param metrics.lowStockItems
 * @param metrics.totalItems
 * @param metrics.unansweredMessages
 * @param metrics.avgResponseTimeHours
 */
export async function analyzeOperationsAnomalies(metrics: {
  bookingsThisWeek: number;
  bookingsLastWeek: number;
  noShowRate: number;
  averageNoShowRate: number;
  newContactsThisWeek: number;
  newContactsLastWeek: number;
  pendingForms: number;
  overdueForms: number;
  lowStockItems: number;
  totalItems: number;
  unansweredMessages: number;
  avgResponseTimeHours?: number;
}): Promise<OperationsAnomaly[]> {
  const prompt = `Analyze these business operations metrics and identify anomalies or concerning trends.

Current Metrics:
- Bookings this week: ${metrics.bookingsThisWeek} (last week: ${metrics.bookingsLastWeek})
- No-show rate: ${(metrics.noShowRate * 100).toFixed(1)}% (average: ${(metrics.averageNoShowRate * 100).toFixed(1)}%)
- New contacts this week: ${metrics.newContactsThisWeek} (last week: ${metrics.newContactsLastWeek})
- Pending forms: ${metrics.pendingForms}, Overdue: ${metrics.overdueForms}
- Low stock items: ${metrics.lowStockItems} of ${metrics.totalItems}
- Unanswered messages: ${metrics.unansweredMessages}
${metrics.avgResponseTimeHours ? `- Avg response time: ${metrics.avgResponseTimeHours.toFixed(1)}h` : ""}

Return a JSON array of anomalies (empty array if operations look normal):
[{
  "type": "no_show_spike" | "booking_decline" | "inventory_crisis" | "communication_gap" | "form_backlog" | "lead_surge",
  "severity": "critical" | "warning" | "info",
  "description": "Brief description of the anomaly",
  "recommendation": "Specific actionable recommendation",
  "metric": "which metric is anomalous",
  "expectedRange": "what normal looks like",
  "actualValue": "what we're seeing"
}]

Only include genuine anomalies. Don't flag things that are normal. Max 3 anomalies.`;

  const text = await callGemini(prompt, "You are an operations intelligence analyst. Only flag genuine anomalies. Be data-driven and precise.", true);
  return parseJSON<OperationsAnomaly[]>(text, []);
}

// ──────────────────────────────────────────────
// SOTA AI Brain: Lead/Contact Scoring
// ──────────────────────────────────────────────

export interface ContactScore {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  factors: { factor: string; impact: "positive" | "negative" | "neutral"; weight: number }[];
  summary: string;
  nextBestAction: string;
}

/**
 *
 * @param contactData
 * @param contactData.name
 * @param contactData.totalBookings
 * @param contactData.completedBookings
 * @param contactData.noShows
 * @param contactData.cancelledBookings
 * @param contactData.totalMessages
 * @param contactData.formsCompleted
 * @param contactData.formsPending
 * @param contactData.daysSinceLastBooking
 * @param contactData.daysSinceFirstContact
 */
export async function scoreContact(contactData: {
  name: string;
  totalBookings: number;
  completedBookings: number;
  noShows: number;
  cancelledBookings: number;
  totalMessages: number;
  formsCompleted: number;
  formsPending: number;
  daysSinceLastBooking: number;
  daysSinceFirstContact: number;
}): Promise<ContactScore> {
  const prompt = `Score this contact/lead for a service-based business on a 0-100 scale.

Contact Data:
- Name: ${contactData.name}
- Total bookings: ${contactData.totalBookings} (completed: ${contactData.completedBookings}, no-shows: ${contactData.noShows}, cancelled: ${contactData.cancelledBookings})
- Messages exchanged: ${contactData.totalMessages}
- Forms: ${contactData.formsCompleted} completed, ${contactData.formsPending} pending
- Days since last booking: ${contactData.daysSinceLastBooking}
- Days since first contact: ${contactData.daysSinceFirstContact}

Respond in JSON:
{
  "score": 0-100 (higher = more engaged/valuable),
  "grade": "A" (80+), "B" (60-79), "C" (40-59), "D" (20-39), "F" (0-19),
  "factors": [{ "factor": "name", "impact": "positive|negative|neutral", "weight": 0.0-1.0 }],
  "summary": "One sentence summary of this contact's engagement level",
  "nextBestAction": "Specific action to take with this contact"
}`;

  const text = await callGemini(prompt, "You are a CRM lead scoring expert. Score based on engagement, reliability, and business value. Be data-driven.", true);
  return parseJSON<ContactScore>(text, {
    score: 50,
    grade: "C",
    factors: [],
    summary: "Insufficient data for scoring",
    nextBestAction: "Engage with this contact to learn more",
  });
}
