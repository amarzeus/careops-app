import { prisma } from "@/lib/prisma";
import { checkUsageLimit } from "./razorpay-subscriptions";
import { createVapiAssistant, createVapiPhoneNumber, VOICE_TOOLS } from "./vapi";

// Map template tool names to actual VOICE_TOOLS definitions
const getToolsForTemplate = (toolNames: readonly string[]) => {
  return toolNames
    .map((name) => {
      const tool = VOICE_TOOLS.find((t) => t.function.name === name);
      if (!tool) {
        console.warn(`Tool ${name} not found in VOICE_TOOLS`);
      }
      return tool;
    })
    .filter((t) => t !== undefined);
};

export const AGENT_TEMPLATES = {
  receptionist: {
    key: "receptionist",
    name: "Virtual Receptionist",
    description: "Handles incoming calls, answers FAQs, routes to staff",
    systemPrompt: `You are a professional virtual receptionist for {businessName}.

SERVICES OFFERED:
{services}

BUSINESS HOURS:
{businessHours}

YOUR RESPONSIBILITIES:
1. Greet callers warmly and professionally
2. Answer questions about services, pricing, and availability
3. Help customers book appointments when requested
4. Take messages for staff when needed
5. Transfer urgent calls to human staff when appropriate

GUIDELINES:
- Be concise but helpful
- Always confirm booking details before finalizing
- If unsure about something, offer to connect to a human
- Never share sensitive information without verification
- End calls professionally with a thank you

CAPABILITIES YOU HAVE:
- Check appointment availability
- Book new appointments
- Cancel or reschedule existing appointments
- Answer common questions about services

PRICING:
{pricing}`,
    defaultVoiceId: "21m00Tcm4TlvDq8ikWAM",
    tools: [
      "check_availability",
      "create_booking",
      "reschedule_booking",
      "transfer_to_staff",
      "get_services",
      "get_business_hours",
    ],
  },

  booking: {
    key: "booking",
    name: "Booking Specialist",
    description: "Specialized in appointment scheduling and management",
    systemPrompt: `You are a booking specialist for {businessName}.

SERVICES:
{services}

AVAILABILITY:
{businessHours}

YOUR PRIMARY GOAL:
Help customers schedule, reschedule, or cancel appointments efficiently.

PROCESS:
1. Ask what service they need
2. Check availability for their preferred time
3. Offer alternatives if preferred time is unavailable
4. Confirm all details before booking
5. Provide confirmation number and any prep instructions

Always be helpful and try to find a solution that works for the customer.`,
    defaultVoiceId: "EXAVITQu4vr4xnSDxMaL",
    tools: ["check_availability", "create_booking", "reschedule_booking", "get_booking_status"],
  },

  support: {
    key: "support",
    name: "Customer Support Agent",
    description: "Handles customer inquiries and resolves issues",
    systemPrompt: `You are a customer support agent for {businessName}.

SERVICES:
{services}

YOUR ROLE:
Help customers with questions, issues, and concerns about their service.

COMMON ISSUES TO HELP WITH:
- Appointment confirmations and reminders
- Service information and pricing
- Rescheduling requests
- Feedback and complaints
- General inquiries

ESCALATION:
If you cannot resolve an issue or the customer requests to speak with someone:
- Offer to transfer to a human agent
- Take detailed notes about the issue
- Promise follow-up if appropriate

Always maintain a calm, professional, and empathetic tone.`,
    defaultVoiceId: "yoZ06aMxZJJ28mfd3POQ",
    tools: ["get_booking_status", "transfer_to_staff"],
  },

  outbound: {
    key: "outbound",
    name: "Outbound Call Agent",
    description: "Makes appointment reminders and follow-up calls",
    systemPrompt: `You are an outbound call agent for {businessName}.

PURPOSE:
Make appointment reminders and follow-up calls to customers.

CALL TYPES:
1. Appointment Reminders: Confirm upcoming appointments 24-48 hours before
2. Follow-ups: Check satisfaction after service delivery
3. Re-engagement: Reach out to customers who haven't visited recently

SCRIPT GUIDELINES:
- Introduce yourself and the business clearly
- State the purpose of the call early
- Be respectful of the customer's time
- Confirm or reschedule as needed
- Thank them for their time

Always be polite and professional. If the customer seems busy, offer to call back at a better time.`,
    defaultVoiceId: "21m00Tcm4TlvDq8ikWAM",
    tools: ["get_booking_status", "reschedule_booking"],
  },
} as const;

export type AgentTemplateKey = keyof typeof AGENT_TEMPLATES;

/**
 *
 */
export async function createWorkspaceVoiceAgent(
  workspaceId: string,
  templateKey: AgentTemplateKey,
  customization: {
    businessName: string;
    services: { name: string; duration: number; price?: number }[];
    businessHours: { open: string; close: string; days: string[] };
    additionalInstructions?: string;
    voiceId?: string;
    voiceModel?: string;
  }
): Promise<{ agentId: string; vapiAssistantId: string }> {
  const template = AGENT_TEMPLATES[templateKey];

  const servicesList = customization.services
    .map((s) => `- ${s.name}: ${s.duration} minutes${s.price ? ` (₹${s.price})` : ""}`)
    .join("\n");

  const businessHoursStr = `${customization.businessHours.days.join(", ")}: ${customization.businessHours.open} - ${customization.businessHours.close}`;

  let systemPrompt = template.systemPrompt
    .replace("{businessName}", customization.businessName)
    .replace("{services}", servicesList)
    .replace("{businessHours}", businessHoursStr)
    .replace(
      "{pricing}",
      customization.services
        .filter((s) => s.price)
        .map((s) => `${s.name}: ₹${s.price}`)
        .join("\n") || "Contact for pricing"
    );

  if (customization.additionalInstructions) {
    systemPrompt += `\n\nADDITIONAL INSTRUCTIONS:\n${customization.additionalInstructions}`;
  }

  const tools = getToolsForTemplate(template.tools);

  const vapiAssistant = await createVapiAssistant({
    name: `${customization.businessName} - ${template.name}`,
    systemPrompt,
    voiceId: customization.voiceId || template.defaultVoiceId,
    workspaceId,
    tools,
    voiceModel: customization.voiceModel,
  });

  const agent = await prisma.voiceAgent.create({
    data: {
      workspaceId,
      name: `${customization.businessName} - ${template.name}`,
      vapiAssistantId: vapiAssistant.id,
      prompt: systemPrompt,
      voiceId: customization.voiceId || template.defaultVoiceId,
      isActive: true,
      canBook: (template.tools as readonly string[]).includes("create_booking"),
      canCheckStatus:
        (template.tools as readonly string[]).includes("check_availability") ||
        (template.tools as readonly string[]).includes("get_booking_status"),
      canTransfer: (template.tools as readonly string[]).includes("transfer_to_staff"),
      canHandleInquiry: true,
    },
  });

  return {
    agentId: agent.id,
    vapiAssistantId: vapiAssistant.id,
  };
}

/**
 *
 */
export async function provisionPhoneNumber(
  workspaceId: string,
  options: {
    phoneNumber: string;
    agentId: string;
    label?: string;
  }
): Promise<{ phoneNumberId: string; vapiPhoneId: string }> {
  const voiceLimit = await checkUsageLimit(workspaceId, "voice_minutes");
  if (!voiceLimit.allowed && voiceLimit.limit !== -1) {
    throw new Error(`Voice not available on your plan. Please upgrade to use phone numbers.`);
  }

  const existingNumbers = await prisma.phoneNumber.count({
    where: { workspaceId },
  });

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { planKey: true },
  });

  const planKey = subscription?.planKey || "free";
  const maxNumbers = planKey === "free" ? 0 : planKey === "growth" ? 1 : planKey === "pro" ? 3 : -1;

  if (maxNumbers !== -1 && existingNumbers >= maxNumbers) {
    throw new Error(
      `Phone number limit reached. Your ${planKey} plan allows ${maxNumbers} number(s). Please upgrade.`
    );
  }

  const agent = await prisma.voiceAgent.findFirst({
    where: { id: options.agentId, workspaceId },
  });

  if (!agent || !agent.vapiAssistantId) {
    throw new Error("Agent not found or not properly configured");
  }

  const vapiPhone = await createVapiPhoneNumber({
    number: options.phoneNumber,
    assistantId: agent.vapiAssistantId,
    workspaceId,
  });

  const phoneNumber = await prisma.phoneNumber.create({
    data: {
      phoneNumber: options.phoneNumber,
      label: options.label,
      vapiPhoneId: vapiPhone.id,
      workspaceId,
      voiceAgentId: options.agentId,
      isActive: true,
    },
  });

  return {
    phoneNumberId: phoneNumber.id,
    vapiPhoneId: vapiPhone.id,
  };
}

/**
 *
 */
export async function searchAvailablePhoneNumbers(
  countryCode: string = "IN",
  areaCode?: string
): Promise<{ phoneNumber: string; region: string; capabilities: string[] }[]> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

  if (!twilioAccountSid || !twilioAuthToken) {
    return [
      { phoneNumber: "+91XXXXXXXXXX", region: "Mumbai", capabilities: ["voice", "sms"] },
      { phoneNumber: "+91XXXXXXXXXY", region: "Delhi", capabilities: ["voice", "sms"] },
      { phoneNumber: "+91XXXXXXXXXZ", region: "Bangalore", capabilities: ["voice", "sms"] },
    ];
  }

  const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");
  const url = new URL(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/AvailablePhoneNumbers/${countryCode}/Local.json`
  );

  if (areaCode) {
    url.searchParams.set("AreaCode", areaCode);
  }
  url.searchParams.set("Limit", "10");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to search phone numbers");
  }

  const data = await response.json();

  return data.available_phone_numbers.map(
    (n: { phone_number: string; region: string; capabilities: string[] }) => ({
      phoneNumber: n.phone_number,
      region: n.region || "Unknown",
      capabilities: n.capabilities || ["voice"],
    })
  );
}
