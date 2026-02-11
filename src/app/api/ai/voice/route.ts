import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, conversationHistory } = await req.json();
  if (!message)
    return NextResponse.json({ error: "Message is required" }, { status: 400 });

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

  const contextSummary = {
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

  const systemPrompt = `You are CareOps AI — a voice-first operations assistant for "${contextSummary.workspaceName}".
You are speaking to ${contextSummary.userName} (${contextSummary.userRole}).

## YOUR PERSONALITY
- You are like Siri/Google Assistant but specialized for business operations.
- Respond naturally, concisely, and conversationally — your responses will be spoken aloud via TTS.
- Keep answers to 2-4 sentences max. Be direct and informative.
- Use natural spoken language (not bullet points or markdown).

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
- Settings: /settings (configuration)

## RESPONSE FORMAT
Return ONLY a valid JSON object:
{
  "message": "Your natural spoken response (2-4 sentences, conversational)",
  "action": null or { "type": "navigate", "path": "/inbox" }
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      generationConfig: { responseMimeType: "application/json" },
    });

    // Strip trailing user messages from history since sendMessage() adds the current one
    let historyMsgs = (conversationHistory || [])
      .filter((msg: any) => msg.content && msg.content.trim());
    while (historyMsgs.length > 0 && historyMsgs[historyMsgs.length - 1].role === "user") {
      historyMsgs = historyMsgs.slice(0, -1);
    }
    // Merge consecutive same-role messages
    const merged: Array<{ role: string; content: string }> = [];
    for (const msg of historyMsgs) {
      if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
        merged[merged.length - 1].content += "\n" + msg.content;
      } else {
        merged.push({ ...msg });
      }
    }
    // Gemini requires history to start with "user" role
    if (merged.length > 0 && merged[0].role === "assistant") {
      merged.unshift({ role: "user", content: "Hello" });
    }
    // Ensure ends with model
    if (merged.length > 0 && merged[merged.length - 1].role === "user") {
      merged.pop();
    }
    const geminiHistory = merged.map((msg: any) => ({
      role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    try {
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        message: parsed.message || "I'm here to help with your business operations.",
        action: parsed.action || null,
      });
    } catch {
      // Gemini returned non-JSON — use as plain message
      return NextResponse.json({
        message: response,
        action: null,
      });
    }
  } catch (error) {
    console.error("Voice AI Error:", error);
    return NextResponse.json({
      message:
        "Sorry, I had trouble processing that. Could you try rephrasing your question?",
      action: null,
    });
  }
}
