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
}): Promise<string> {
  return generateAIResponse(
    `You are an AI business analytics assistant. Based on these metrics, provide 2-3 brief, actionable insights for the business owner. Be concise and practical.
    
Metrics:
- Total bookings: ${data.totalBookings}
- Completed bookings: ${data.completedBookings}
- New contacts this week: ${data.newContacts}
- Pending forms: ${data.pendingForms}
- Low stock items: ${data.lowStockItems}
- Unread messages: ${data.unreadMessages}

Return insights as a short paragraph. No bullet points, no markdown. Just plain text.`
  );
}

export async function aiOnboardingAssistant(
  userMessage: string,
  currentStep: number,
  businessInfo: Record<string, unknown>
): Promise<{ message: string; extractedData?: Record<string, unknown> }> {
  const stepDescriptions: Record<number, string> = {
    1: "Setting up workspace (need: business name, address, timezone, contact email)",
    2: "Configuring email/SMS (need: email provider setup)",
    3: "Creating contact form (need: form name, fields)",
    4: "Setting up bookings (need: service types, duration, availability)",
    5: "Setting up post-booking forms (need: intake form fields)",
    6: "Configuring inventory (need: item names, quantities, thresholds)",
    7: "Adding staff members (need: staff emails, permissions)",
    8: "Final review and activation",
  };

  const response = await generateAIResponse(
    `You are CareOps AI onboarding assistant. You help business owners set up their workspace through natural conversation.

Current onboarding step: ${currentStep} - ${stepDescriptions[currentStep] || "Unknown"}
Business info so far: ${JSON.stringify(businessInfo)}
User message: "${userMessage}"

Respond naturally. If the user provides information relevant to the current step, extract it. 
Return a JSON object with:
- "message": your conversational response (be helpful, concise, professional)
- "extractedData": an object with any data you could extract from the user's message (use camelCase keys matching the fields needed), or null if no data was extracted

Return ONLY the JSON object, nothing else.`
  );

  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { message: response };
  }
}
