import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateAIResponse(prompt: string, context?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const fullPrompt = context
      ? `Context: ${context}\n\nTask: ${prompt}`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "I'm sorry, I couldn't process that request right now.";
  }
}

export async function generateWelcomeMessage(businessName: string, contactName: string): Promise<string> {
  return generateAIResponse(
    `Generate a warm, professional welcome message from "${businessName}" to a new contact named "${contactName}". Keep it under 3 sentences. Be friendly but professional. Don't use emojis. Just return the message text, nothing else.`
  );
}

export async function generateBookingConfirmation(
  businessName: string,
  contactName: string,
  serviceName: string,
  dateTime: string,
  location?: string
): Promise<string> {
  return generateAIResponse(
    `Generate a booking confirmation message from "${businessName}" to "${contactName}" for "${serviceName}" on ${dateTime}${location ? ` at ${location}` : ""}. Include key details and a professional tone. Keep it under 5 sentences. Just return the message text, nothing else.`
  );
}

export async function generateSmartReply(
  businessName: string,
  conversationHistory: string,
  lastMessage: string
): Promise<string[]> {
  const response = await generateAIResponse(
    `You are an AI assistant for "${businessName}". Based on the conversation history and the last message, suggest 3 possible professional reply options. Return ONLY a JSON array of 3 strings, nothing else.
    
    Conversation history: ${conversationHistory}
    Last message from customer: ${lastMessage}`
  );

  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      "Thank you for reaching out. Let me look into that for you.",
      "I appreciate your message. I'll get back to you shortly with more details.",
      "Thanks for contacting us. How can I assist you further?",
    ];
  }
}

export async function generateDashboardInsights(data: {
  totalBookings: number;
  completedBookings: number;
  newContacts: number;
  pendingForms: number;
  lowStockItems: number;
  unreadMessages: number;
}): Promise<Array<{ priority: "high" | "medium" | "low"; category: string; message: string; action: string }>> {
  const response = await generateAIResponse(
    `You are an AI business analytics assistant. Based on these metrics, provide 3 brief, high-impact, actionable insights.
    
    Metrics:
    - Total bookings: ${data.totalBookings}
    - Completed bookings: ${data.completedBookings}
    - New contacts this week: ${data.newContacts}
    - Pending forms: ${data.pendingForms}
    - Low stock items: ${data.lowStockItems}
    - Unread messages: ${data.unreadMessages}
    
    Return ONLY a JSON array of objects with:
    - "priority": "high", "medium", or "low"
    - "category": e.g., "Operations", "Inventory", "Communication"
    - "message": the insight 
    - "action": suggested next step
    
    Return ONLY the JSON array, nothing else.`
  );

  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      { priority: "medium", category: "Operations", message: "You have several pending forms to review.", action: "Go to Forms" },
      { priority: "medium", category: "Communication", message: "New contacts are waiting for a reply.", action: "Open Inbox" }
    ];
  }
}

export async function refineMessage(content: string, tone: string = "professional"): Promise<string> {
  return generateAIResponse(
    `Refine this message to be more ${tone}, polite, and professional. Keep the original meaning but make it sound world-class.
    
    Original: "${content}"
    
    Return ONLY the refined text.`
  );
}

export async function generateInventoryForecast(items: Array<{ name: string; quantity: number; threshold: number; unit: string }>): Promise<Array<{ id: string; daysRemaining: number | string; confidence: string }>> {
  if (items.length === 0) return [];

  const response = await generateAIResponse(
    `You are an inventory specialist. Based on current stock and thresholds, estimate how many days of stock are remaining for each item. 
This is a heuristic estimate based on "low stock" meaning typical 3-5 days left.

Items: ${JSON.stringify(items)}

Return ONLY a JSON array of objects with:
- "name": matching the item name
- "daysRemaining": number (or "Critical" if 0)
- "confidence": "high", "medium", or "low"

Return ONLY the JSON array, nothing else.`
  );

  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ---- Helper: Build step-specific completion status ----
function buildStepStatus(step: number, info: Record<string, any>): string {
  const ws = info.workspace || {};
  const email = info.emailConfig || {};
  const cf = info.contactForm || {};
  const svcs = info.services || [];
  const forms = info.intakeForms || [];
  const inv = info.inventoryItems || [];
  const staff = info.staffMembers || [];

  // Infer business type from workspace name (heuristic)
  const nameLower = (ws.name || "").toLowerCase();
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
    case 1:
      return `BUSINESS TYPE: ${businessType}
THIS STEP — Workspace fields:
${JSON.stringify(ws, null, 2)}`;

    case 2:
      return `BUSINESS TYPE: ${businessType}
THIS STEP — Email/SMS fields:
${JSON.stringify(email, null, 2)}`;

    case 3:
      return `BUSINESS TYPE: ${businessType}
THIS STEP — Contact Form:
${JSON.stringify(cf, null, 2)}`;

    case 4:
      return `BUSINESS TYPE: ${businessType}
THIS STEP — Services/Bookings:
EXISTING SERVICES (Full Details):
${JSON.stringify(svcs, null, 2)}`;

    case 5:
      return `BUSINESS TYPE: ${businessType}
THIS STEP — Intake Forms:
EXISTING FORMS (Full Details):
${JSON.stringify(forms, null, 2)}`;

    case 6:
      return `BUSINESS TYPE: ${businessType}
THIS STEP — Inventory:
EXISTING ITEMS (Full Details):
${JSON.stringify(inv, null, 2)}`;

    case 7:
      return `BUSINESS TYPE: ${businessType}
THIS STEP — Staff:
EXISTING STAFF (Full Details):
${JSON.stringify(staff, null, 2)}`;

    case 8:
      return `BUSINESS TYPE: ${businessType}
ACTIVATION CHECKLIST:
${JSON.stringify({ ws, email, cf, serviceCount: svcs.length, formCount: forms.length, invCount: inv.length, staffCount: staff.length }, null, 2)}`;

    default:
      return JSON.stringify(info, null, 2);
  }
}

// ---- Helper: Sanitize Gemini chat history ----
function sanitizeGeminiHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>
): Array<{ role: "user" | "model"; parts: [{ text: string }] }> {
  let msgs = history.filter(m => m.content && m.content.trim());

  // Strip trailing user messages (the current one will be sent via sendMessage)
  while (msgs.length > 0 && msgs[msgs.length - 1].role === "user") {
    msgs = msgs.slice(0, -1);
  }

  if (msgs.length === 0) return [];

  // Merge consecutive same-role messages to satisfy Gemini's alternating requirement
  const merged: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const msg of msgs) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += "\n" + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  // Ensure starts with "user"
  if (merged.length > 0 && merged[0].role === "assistant") {
    merged.unshift({ role: "user", content: "Hello, I'm setting up my business." });
  }

  // Ensure ends with "model" (Gemini requirement for history)
  if (merged.length > 0 && merged[merged.length - 1].role === "user") {
    merged.pop();
  }

  return merged.map(m => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));
}

export async function aiOnboardingAssistant(
  userMessage: string,
  currentStep: number,
  businessInfo: Record<string, any>,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<{ message: string; extractedData: Record<string, any> | null; shouldAdvance: boolean; navigationAction: { type: "jump"; targetStep: number } | null }> {
  console.log("🤖 AI Assistant Called | Step:", currentStep);
  console.log("📝 Business Context:", JSON.stringify(businessInfo, null, 2));


  // Step definitions — only extraction schema, no vague "goals"
  const stepSchemas: Record<number, { title: string; schema: string }> = {
    1: { title: "Workspace Setup", schema: '{ "name": "...", "address": "...", "timezone": "...", "contactEmail": "...", "contactPhone": "..." }' },
    2: { title: "Email & SMS", schema: '{ "emailFromName": "...", "emailFromAddress": "...", "emailConfigured": true }' },
    3: { title: "Contact Form", schema: '{ "formName": "...", "welcomeMessage": "..." }' },
    4: { title: "Bookings / Services", schema: '{ "addServices": [{ "name": "...", "duration": "30", "location": "...", "startTime": "09:00", "endTime": "17:00" }], "updateServices": [{ "name": "...", "duration": "...", "location": "...", "startTime": "...", "endTime": "..." }], "removeServices": ["Exact Name"] }' },
    5: { title: "Intake Forms", schema: '{ "addIntakeForms": [{ "name": "...", "description": "...", "fields": "[]" }], "updateIntakeForms": [{ "name": "...", "description": "...", "fields": "..." }], "removeIntakeForms": ["Exact Name"] }' },
    6: { title: "Inventory", schema: '{ "addInventoryItems": [{ "name": "...", "quantity": "...", "threshold": "...", "unit": "..." }], "updateInventoryItems": [{ "name": "...", "quantity": "...", "threshold": "...", "unit": "..." }], "removeInventoryItems": ["Exact Name"] }' },
    7: { title: "Staff", schema: '{ "addStaffMember": { "name": "...", "email": "...", "role": "STAFF" }, "updateStaffMember": { "email": "...", "name": "...", "role": "..." }, "removeStaffMember": "email@address.com" }' },
    8: { title: "Activate", schema: 'null' },
  };

  const stepInfo = stepSchemas[currentStep] || { title: "Unknown", schema: "null" };
  const stepStatus = buildStepStatus(currentStep, businessInfo);
  const isGreeting = userMessage.startsWith("__GREETING__");
  const actualMessage = isGreeting ? "I just arrived on this step. Give me a proactive fire-up greeting." : userMessage;

  const systemPrompt = `You are CareOps AI — a proactive onboarding concierge.

═══════════════════════════════════════════
  CURRENT STEP: ${currentStep} of 8 — "${stepInfo.title}"
═══════════════════════════════════════════

## STEP STATUS (FULL CONTEXT):
${stepStatus}

## BEHAVIOR RULES:

1. **EXECUTE REQUIRED ACTION**:
   - Look at "REQUIRED_ACTION" in the status above.
   - If it says "ASK: ...", you **MUST** ask that question in your response.
   - Do NOT just acknowledge "Updated". Acknowledge AND ASK.

2. **FOCUS & NAVIGATION**: 
   - Focus on Step ${currentStep}.
   - **EXCEPTION**: If user asks to "go back" or "change [previous step]", return "navigationAction": { "type": "jump", "targetStep": [number] }.

2. **INTERACTION STYLE**:
   - **IF GREETING (User just arrived)**: 
     - **Steps 1-3 (Setup)**: You MUST ask a direct question for the first [EMPTY] field. Example: "What is the business email address?" (Do not just say "Let's set up email").
     - **Steps 4-8 (Lists)**: Suggest a full list of items based on business type and ask "Should I add these?".
     - **DO NOT** be repetitive ("Hello! CareOps here!"). Be efficient.
   - **IF ONGOING**: 
     - Acknowledge input briefly (e.g., "Got it", "Updated").
     - **IMMEDIATELY** asking for the *NEXT* missing [EMPTY] field in the same message.
     - **DO NOT WAIT** for the user to ask "what's next?". YOU lead the flow.
     - If all fields are filled, ask: "Everything looks good here. Ready to move to the next step?"

3. **SMART DEFAULTS (Business Type: ${businessInfo.workspace?.name ? "Inferred" : "Generic"})**:
   - Use the context to suggest relevant services/forms if fields are empty.
   - **STRICT TIMEZONES**: Map location to: UTC, America/New_York, America/Chicago, America/Denver, America/Los_Angeles, Asia/Kolkata, Europe/London.

4. **DATA EXTRACTION**:
   - Extract ALL provided data.
   - If user says "use defaults" or "yes", generate the full configuration for this step.

5. **JSON ONLY**: Return ONLY the JSON object. No markdown. No text outside JSON.

## EXTRACTION SCHEMA for Step ${currentStep}:
${stepInfo.schema}

## JSON RESPONSE FORMAT:
{
  "message": "Conversational response (max 2 sentences)",
  "extractedData": <schema object or null>,
  "shouldAdvance": false,
  "navigationAction": null or { "type": "jump", "targetStep": <number> }
}

## REFERENCE - STEP MAP (Use this to resolve "targetStep"):
1: Workspace (Name, Address, Phone)
2: Communication (Email, SMS)
3: Contact Form (Public form, Welcome message)
4: Bookings (Services, Durations, Prices)
5: Intake Forms (Post-booking questions)
6: Inventory (Items, Stock, Thresholds)
7: Staff (Team members, Access)
8: Activate (Review & Launch)`;

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

    try {
      // Robust JSON extraction: match first { to last }
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleaned = jsonMatch ? jsonMatch[0] : text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      const parsed = JSON.parse(cleaned);
      return {
        message: parsed.message || "Let me help you with that.",
        extractedData: parsed.extractedData || null,
        shouldAdvance: !!parsed.shouldAdvance,
        navigationAction: parsed.navigationAction || null
      };
    } catch (parseError) {
      console.warn("AI JSON Parse Error:", parseError, "Text received:", text);
      // Fallback: if text looks like a normal message, treat it as one
      if (!text.includes("{")) {
        return { message: text, extractedData: null, shouldAdvance: false, navigationAction: null };
      }
      throw parseError; // Re-throw to outer catch if it really was broken JSON
    }
  } catch (err: any) {
    console.error("AI Onboarding Error:", err?.message || err);
    return {
      message: "I had a small hiccup processing that. Could you try again?",
      extractedData: null,
      shouldAdvance: false,
      navigationAction: null
    };
  }
}
export type AIOnboardingResponse = {
  message: string;
  extractedData: Record<string, any> | null;
  shouldAdvance: boolean;
  navigationAction: { type: "jump"; targetStep: number } | null;
};
