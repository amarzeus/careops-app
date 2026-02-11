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
  name: ${ws.name ? `"${ws.name}" [FILLED]` : "[EMPTY - REQUIRED]"}
  address: ${ws.address ? `"${ws.address}" [FILLED]` : "[EMPTY]"}
  timezone: ${ws.timezone && ws.timezone !== "UTC" ? `"${ws.timezone}" [FILLED]` : `"UTC" [DEFAULT - suggest based on location]`}
  contactEmail: ${ws.contactEmail ? `"${ws.contactEmail}" [FILLED]` : "[EMPTY - REQUIRED]"}
  contactPhone: ${ws.contactPhone ? `"${ws.contactPhone}" [FILLED]` : "[EMPTY - OPTIONAL]"}`;

    case 2:
      return `BUSINESS TYPE: ${businessType}
COMPLETED: Workspace="${ws.name}" (${ws.address || "no address"})
THIS STEP — Email/SMS fields:
  emailFromName: ${email.emailFromName ? `"${email.emailFromName}" [FILLED]` : "[EMPTY]"}
  emailFromAddress: ${email.emailFromAddress ? `"${email.emailFromAddress}" [FILLED]` : "[EMPTY]"}
  emailConfigured: ${email.emailConfigured ? "true [ENABLED]" : "false [DISABLED]"}
SUGGESTION: Use "${ws.name || "Business"}" as sender name, "${ws.contactEmail || ""}" as sender email.`;

    case 3:
      return `BUSINESS TYPE: ${businessType}
COMPLETED: Workspace="${ws.name}", Email=${email.emailConfigured ? "Enabled" : "Disabled"}
THIS STEP — Contact Form fields:
  formName: ${cf.name && cf.name !== "Contact Us" ? `"${cf.name}" [FILLED]` : `"Contact Us" [DEFAULT]`}
  welcomeMessage: ${cf.welcomeMessage && cf.welcomeMessage !== "Thank you for reaching out! We'll get back to you shortly." ? `[CUSTOMIZED]` : "[DEFAULT - suggest custom based on business type]"}`;

    case 4:
      return `BUSINESS TYPE: ${businessType}
COMPLETED: Workspace="${ws.name}", Email=${email.emailConfigured ? "Enabled" : "Disabled"}, Contact Form="${cf.name || "Contact Us"}"
THIS STEP — Services/Bookings:
  Current services (${svcs.length}): ${svcs.length > 0 ? svcs.map((s: any) => `"${s.name}" (${s.duration}min)`).join(", ") : "NONE YET — suggest services based on business type"}
  Address for location default: "${ws.address || ""}"`;

    case 5:
      return `BUSINESS TYPE: ${businessType}
COMPLETED: Workspace="${ws.name}", Email=${email.emailConfigured ? "Enabled" : "Disabled"}, Contact Form="${cf.name || "Contact Us"}", Services=${svcs.length > 0 ? svcs.map((s: any) => s.name).join(", ") : "none"}
THIS STEP — Intake Forms (post-booking):
  Current intake forms (${forms.length}): ${forms.length > 0 ? forms.map((f: any) => `"${f.name}"`).join(", ") : "NONE YET — suggest forms with questions based on business type"}`;

    case 6:
      return `BUSINESS TYPE: ${businessType}
COMPLETED: Workspace="${ws.name}", Services=${svcs.length}, Intake Forms=${forms.length}
THIS STEP — Inventory/Resources:
  Current items (${inv.length}): ${inv.length > 0 ? inv.map((i: any) => `"${i.name}" (${i.quantity} ${i.unit})`).join(", ") : "NONE YET — suggest inventory items based on business type"}`;

    case 7:
      return `BUSINESS TYPE: ${businessType}
COMPLETED: Workspace="${ws.name}", Services=${svcs.length}, Forms=${forms.length}, Inventory=${inv.length}
THIS STEP — Staff (OPTIONAL):
  Current staff (${staff.length}): ${staff.length > 0 ? staff.map((s: any) => `"${s.name}" (${s.email})`).join(", ") : "NONE — this step can be skipped"}`;

    case 8:
      return `BUSINESS TYPE: ${businessType}
ACTIVATION CHECKLIST:
  Workspace: ${ws.name ? `"${ws.name}" [OK]` : "[MISSING]"}
  Communication: ${email.emailConfigured ? "[OK]" : "[NOT CONFIGURED]"}
  Contact Form: ${cf.name ? `"${cf.name}" [OK]` : "[MISSING]"}
  Services: ${svcs.length > 0 ? `${svcs.length} service(s) [OK]` : "[NONE]"}
  Intake Forms: ${forms.length > 0 ? `${forms.length} form(s) [OK]` : "[NONE - optional]"}
  Inventory: ${inv.length > 0 ? `${inv.length} item(s) [OK]` : "[NONE - optional]"}
  Staff: ${staff.length > 0 ? `${staff.length} member(s) [OK]` : "[NONE - optional]"}`;

    default:
      return JSON.stringify(info);
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
): Promise<{ message: string; extractedData: Record<string, any> | null; shouldAdvance: boolean }> {

  // Step definitions — only extraction schema, no vague "goals"
  const stepSchemas: Record<number, { title: string; schema: string }> = {
    1: { title: "Workspace Setup", schema: '{ "name": "...", "address": "...", "timezone": "...", "contactEmail": "...", "contactPhone": "..." }' },
    2: { title: "Email & SMS", schema: '{ "emailFromName": "...", "emailFromAddress": "...", "emailConfigured": true }' },
    3: { title: "Contact Form", schema: '{ "formName": "...", "welcomeMessage": "..." }' },
    4: { title: "Bookings / Services", schema: '{ "addServices": [{ "name": "...", "duration": "30", "location": "...", "startTime": "09:00", "endTime": "17:00" }] }' },
    5: { title: "Intake Forms", schema: '{ "addIntakeForms": [{ "name": "...", "description": "...", "questions": ["Q1", "Q2", "Q3"] }] }' },
    6: { title: "Inventory", schema: '{ "addInventoryItems": [{ "name": "...", "quantity": "100", "threshold": "10", "unit": "boxes" }] }' },
    7: { title: "Staff", schema: '{ "addStaffMember": { "name": "...", "email": "...", "password": "..." } }' },
    8: { title: "Activate", schema: 'null' },
  };

  const stepInfo = stepSchemas[currentStep] || { title: "Unknown", schema: "null" };
  const stepStatus = buildStepStatus(currentStep, businessInfo);
  const isGreeting = userMessage.startsWith("__GREETING__");
  const actualMessage = isGreeting ? "I just arrived on this step. Give me a proactive fire-up greeting." : userMessage;

  const systemPrompt = `You are CareOps AI — a proactive onboarding concierge that sets up businesses. You don't just ask questions — you TAKE ACTION and suggest complete configurations.

═══════════════════════════════════════════
  CURRENT STEP: ${currentStep} of 8 — "${stepInfo.title}"
═══════════════════════════════════════════

## STEP-SPECIFIC STATUS (READ CAREFULLY):
${stepStatus}

## YOUR BEHAVIOR RULES

1. **FOCUS LOCK**: You are ONLY working on Step ${currentStep} ("${stepInfo.title}"). NEVER mention, ask about, or reference ANY other step. Previous steps are DONE. Future steps don't exist yet.

2. **FIRE-UP GREETING**: When the user just arrives on this step (first message or greeting), you MUST:
   - Acknowledge what's been completed so far in ONE brief phrase
   - Immediately suggest a complete configuration for THIS step based on the business type
   - For Steps 4-6: Proactively generate items and ask "Should I add these?"
   - Example: "Great, your workspace is set up! For your dental clinic, I'd suggest these services: Checkup (30min), Cleaning (45min), Consultation (20min). Want me to add them?"

3. **PROACTIVE DATA EXTRACTION**: Extract ALL possible data from every user message. If the user says "yes", "sounds good", "do it", "set it up" — immediately generate and return the suggested data in extractedData. 

4. **SMART DEFAULTS by business type**:
   - Dental: services (Checkup 30m, Cleaning 45m, Root Canal 60m, Consultation 20m), forms (Patient Intake, Medical History), inventory (Gloves, Masks, Bibs, X-ray film)
   - Salon/Spa: services (Haircut 30m, Color 90m, Manicure 45m, Facial 60m), forms (Client Preferences, Allergy Checklist), inventory (Shampoo, Conditioner, Hair dye, Towels)
   - Medical: services (Consultation 30m, Follow-up 15m, Physical 45m), forms (Medical History, Insurance Info), inventory (Gloves, Syringes, Bandages)
   - Fitness: services (PT Session 60m, Group Class 45m, Assessment 30m), forms (Health Questionnaire, Waiver), inventory (Towels, Mats, Sanitizer)
   - Consulting: services (Discovery Call 30m, Strategy Session 60m, Follow-up 30m), forms (Client Questionnaire, NDA/Agreement), inventory (Notepads, Printed materials)
   - Generic: services (Consultation 30m, Service Appointment 60m, Follow-up 30m), forms (Client Information), inventory (Office Supplies, Cleaning supplies)

    5. **NEVER REPEAT**: If a field is marked [FILLED] above, do NOT ask about it again. Only ask about [EMPTY] fields. If items (services/forms/inventory) are already listed, do NOT suggest the same ones again.

    6. **CONCISE RESPONSES**: 2-3 sentences max. Sound natural and confident. No bullet points in message.

    7. **ADVANCE LOGIC**: Set shouldAdvance=true ONLY when:
       - Steps 1-3: All required fields are filled
       - Steps 4-6: User confirms they're done adding items OR says "continue/next" OR after a bulk add if no other questions asked.
       - Step 7: User says skip/done/next OR confirms after adding staff
       - Step 8: User confirms activation
       - **CRITICAL**: If the user says "continue", "next", "skip", or "go on", ALWAYS set shouldAdvance=true.

    8. **BULK ADD RESPONSE**: When you extract bulk data (addServices, addIntakeForms, etc.):
       - Your message MUST confirm the action AND ask if they are done.
       - Example: "I've added those 3 services. Ready to move to the next step?"
       - Do NOT just say "Okay, I'll add them."

    ## EXTRACTION SCHEMA for Step ${currentStep}:
${stepInfo.schema}

## SINGLE-ITEM ALTERNATIVES (also accepted):
Step 4: { "addService": { "name": "...", "duration": "30", ... } }
Step 5: { "addIntakeForm": { "name": "...", "description": "...", "questions": [...] } }
Step 6: { "addInventoryItem": { "name": "...", "quantity": "...", "threshold": "...", "unit": "..." } }

## JSON RESPONSE FORMAT (STRICT — return ONLY this):
{
  "message": "Your conversational response",
  "extractedData": <schema object or null>,
  "shouldAdvance": false
}`;

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
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        message: parsed.message || "Let me help you with that.",
        extractedData: parsed.extractedData || null,
        shouldAdvance: !!parsed.shouldAdvance,
      };
    } catch {
      return { message: text, extractedData: null, shouldAdvance: false };
    }
  } catch (err: any) {
    console.error("AI Onboarding Error:", err?.message || err);
    return {
      message: "I had a small hiccup processing that. Could you try again?",
      extractedData: null,
      shouldAdvance: false,
    };
  }
}
