import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI, Type } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { message, conversationHistory, clientContext } = await req.json();

  if (!message)
    return NextResponse.json({ error: "Message is required" }, { status: 400 });

  let systemPrompt = "";
  let contextSummary: any = {};

  if (user && user.workspaceId) {
    const wid = user.workspaceId;

    // Gather workspace context for the AI
    const [
      workspace,
      bookingsToday,
      bookingsUpcoming,
      contactsCount,
      unreadConversations,
      pendingForms,
      lowStockItems,
      recentAlerts,
      servicesCount,
      staffCount,
    ] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: wid } }),
      prisma.booking.count({
        where: {
          workspaceId: wid,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.booking.count({
        where: {
          workspaceId: wid,
          date: { gt: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      prisma.contact.count({ where: { workspaceId: wid } }),
      prisma.conversation.count({
        where: { workspaceId: wid, unreadCount: { gt: 0 } },
      }),
      prisma.formSubmission.count({
        where: { workspaceId: wid, status: { in: ["PENDING", "SENT"] } },
      }),
      prisma.inventoryItem.findMany({
        where: { workspaceId: wid },
      }),
      prisma.alert.findMany({
        where: { workspaceId: wid, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.service.count({ where: { workspaceId: wid } }),
      prisma.user.count({ where: { workspaceId: wid, role: "STAFF" } }),
    ]);

    const lowStock = lowStockItems.filter(
      (item: any) => item.quantity <= item.threshold
    );

    contextSummary = {
      workspaceName: workspace?.name || "Unknown",
      todaysBookings: bookingsToday,
      upcomingBookings: bookingsUpcoming,
      totalContacts: contactsCount,
      unreadMessages: unreadConversations,
      pendingForms: pendingForms,
      lowStockItems: lowStock.map((i: any) => ({
        name: i.name,
        qty: i.quantity,
        threshold: i.threshold,
        unit: i.unit,
      })),
      unreadAlerts: recentAlerts.map((a: any) => ({
        type: a.type,
        title: a.title,
        message: a.message,
      })),
      totalServices: servicesCount,
      totalStaff: staffCount,
      userName: user.name,
      userRole: user.role,
    };

    systemPrompt = `You are CareOps AI — a voice-first operations assistant for "${contextSummary.workspaceName}".
You are speaking to ${contextSummary.userName} (${contextSummary.userRole}).

## YOUR PERSONALITY
- You are like Siri/Google Assistant but specialized for business operations.
- Respond naturally, concisely, and conversationally — your responses will be spoken aloud via TTS.
- Keep answers to 2-4 sentences max. Be direct and informative.
- Use natural spoken language (not bullet points or markdown).

## CURRENT CONTEXT
- **Current Page**: ${clientContext?.pathname || "Unknown"}
- **Page Title**: ${clientContext?.title || "Unknown"}
- User is looking at this screen right now. If they ask "what's on this page?" or "explain this", refer to the current page context.

## CURRENT WORKSPACE STATE
- Today's bookings: ${contextSummary.todaysBookings}
- Upcoming bookings: ${contextSummary.upcomingBookings}
- Total contacts: ${contextSummary.totalContacts}
- Unread messages: ${contextSummary.unreadMessages}
- Pending forms: ${contextSummary.pendingForms}
- Low stock items: ${contextSummary.lowStockItems.length > 0 ? contextSummary.lowStockItems.map((i: any) => `${i.name}: ${i.qty} ${i.unit}`).join(", ") : "None"}
- Active alerts: ${contextSummary.unreadAlerts.length > 0 ? contextSummary.unreadAlerts.map((a: any) => a.title).join(", ") : "None"}
- Total services: ${contextSummary.totalServices}
- Staff members: ${contextSummary.totalStaff}

## CAPABILITIES
You can help with:
1. Business status updates ("How's my business doing?", "Any urgent issues?")
2. Booking questions ("How many bookings today?", "What's my schedule look like?")
3. Inventory alerts ("Any items running low?", "What needs restocking?")
4. Inbox status ("Any unread messages?", "How many conversations need attention?")
5. Form tracking ("Any pending forms?", "How are form completions?")
6. General operations advice and suggestions
7. Navigation hints ("Where do I find X?", "How do I set up Y?")

## NAVIGATION HINTS
When relevant, suggest where to go:
- Dashboard: /dashboard (overview)
- Inbox: /inbox (messages)
- Bookings: /bookings (schedule)
- Forms: /forms (intake forms, contact forms)
- Inventory: /inventory (stock tracking)
- Staff: /staff (team management)
- Automation: /automation (rules)
- Settings: /settings (configuration)`;
  } else {
    // PUBLIC / VISITOR MODE
    systemPrompt = `You are CareOps AI — a friendly and knowledgeable voice assistant for the CareOps platform.
You are speaking to a visitor on our landing page who is exploring the platform.

## ABOUT CAREOPS
CareOps is a unified operations platform designed to replace multiple disconnected tools for service businesses.
Key Features and Benefits:
- **Smart Bookings**: No more back-and-forth emails. Automated booking pages and reminders.
- **Unified Inbox**: Manage Email and SMS in one place. AI helps draft perfect responses.
- **Dynamic Forms**: Automated intake forms that sync with your records.
- **Inventory Management**: Real-time tracking with "low stock" alerts and auto-vendor emails.
- **Automation Engine**: Create custom workflows, like "Send a thank you note after a booking is completed."
- **AI Insights**: Gemini AI analyzes your business data to provide growth suggestions.

## YOUR GOALS
1. **Educate**: Explain how these features help save time and grow a business.
2. **Engage**: Be conversational, warm, and inviting.
3. **Convert**: If the visitor seems interested, suggest they click "Get Started Free" to try it out.
4. **Speak Naturally**: Keep responses to 2-3 sentences max. Avoid lists. Use spoken-friendly language.

## CONTEXT
- **User Status**: Guest Visitor (Stranger)
- **Location**: Landing Page`;
  }

  const finalPrompt = `${systemPrompt}

## RESPONSE FORMAT
Returns a JSON object with:
- "message": Natural spoken response
- "action": Optional navigation action { "type": "navigate", "path": "..." }`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      message: { type: Type.STRING },
      action: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          path: { type: Type.STRING },
        },
        nullable: true,
      },
    },
    required: ["message"],
  };

  try {
    const chat = client.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: finalPrompt,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    // Strip trailing user messages from history since sendMessage() adds the current one
    const historyMsgs = (conversationHistory || [])
      .filter((msg: any) => msg.content && msg.content.trim());

    // Simple history sanitization
    const geminiHistory = historyMsgs.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // In new SDK, we don't pass history to create() if using startChat logic? 
    // Wait, client.chats.create returns a Chat object. It supports `history`.
    // But `history` in `create` expects `Content[]`.

    // Let's rely on single-turn generation with history context if `chats` is complex to map,
    // OR just use generateContent with full history.
    // For simplicity and robustness with structured output:

    const contents = [
      ...geminiHistory,
      { role: "user", parts: [{ text: message }] }
    ];

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: finalPrompt,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      contents: contents as any,
    });

    const text = response.text;
    const parsed = JSON.parse(text!) as { message: string, action?: any };

    return NextResponse.json({
      message: parsed.message,
      action: parsed.action || null,
    });

  } catch (error) {
    console.error("Voice AI Error:", error);
    return NextResponse.json({
      message:
        "Sorry, I had trouble processing that. Could you try rephrasing your question?",
      action: null,
    });
  }
}

