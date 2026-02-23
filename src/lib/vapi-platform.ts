import { prisma } from "@/lib/prisma";
import { checkUsageLimit } from "./razorpay-subscriptions";

const getVapiClient = () => {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) throw new Error("VAPI_API_KEY not configured");

  return {
    async createAssistant(config: {
      name: string;
      systemPrompt: string;
      voiceId?: string;
      workspaceId: string;
      tools?: string[];
    }) {
      const response = await fetch("https://api.vapi.ai/assistant", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: config.name,
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: config.systemPrompt,
              },
            ],
            tools: config.tools || [],
          },
          voice: {
            provider: "11labs",
            voiceId: config.voiceId || "21m00Tcm4TlvDq8ikWAM",
          },
          serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/tools`,
          serverHeaders: {
            "X-Workspace-Id": config.workspaceId,
          },
          recordingEnabled: true,
          transcriptEnabled: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create assistant: ${error}`);
      }

      return response.json();
    },

    async createPhoneNumber(config: {
      number: string;
      assistantId: string;
      workspaceId: string;
    }) {
      const response = await fetch("https://api.vapi.ai/phone-number", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: "twilio",
          number: config.number,
          assistantId: config.assistantId,
          serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/tools`,
          serverHeaders: {
            "X-Workspace-Id": config.workspaceId,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create phone number: ${error}`);
      }

      return response.json();
    },

    async listPhoneNumbers() {
      const response = await fetch("https://api.vapi.ai/phone-number", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to list phone numbers");
      }

      return response.json();
    },

    async importTwilioNumber(config: {
      twilioPhoneNumberSid: string;
      assistantId?: string;
      workspaceId: string;
    }) {
      const response = await fetch("https://api.vapi.ai/phone-number/import/twilio", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twilioPhoneNumberSid: config.twilioPhoneNumberSid,
          assistantId: config.assistantId,
          serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/tools`,
          serverHeaders: {
            "X-Workspace-Id": config.workspaceId,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to import Twilio number: ${error}`);
      }

      return response.json();
    },

    async deleteAssistant(assistantId: string) {
      const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      return response.ok;
    },

    async deletePhoneNumber(phoneNumberId: string) {
      const response = await fetch(`https://api.vapi.ai/phone-number/${phoneNumberId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      return response.ok;
    },
  };
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
    tools: ["checkAvailability", "bookAppointment", "cancelAppointment", "transferCall"],
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
    tools: ["checkAvailability", "bookAppointment", "rescheduleAppointment", "cancelAppointment"],
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
    tools: ["checkStatus", "transferCall", "createNote"],
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
    tools: ["checkAppointment", "rescheduleAppointment", "createNote"],
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
  }
): Promise<{ agentId: string; vapiAssistantId: string }> {
  const template = AGENT_TEMPLATES[templateKey];
  const vapiClient = getVapiClient();

  const servicesList = customization.services
    .map((s) => `- ${s.name}: ${s.duration} minutes${s.price ? ` (₹${s.price})` : ""}`)
    .join("\n");

  const businessHoursStr = `${customization.businessHours.days.join(", ")}: ${customization.businessHours.open} - ${customization.businessHours.close}`;

  let systemPrompt = template.systemPrompt
    .replace("{businessName}", customization.businessName)
    .replace("{services}", servicesList)
    .replace("{businessHours}", businessHoursStr)
    .replace("{pricing}", customization.services
      .filter((s) => s.price)
      .map((s) => `${s.name}: ₹${s.price}`)
      .join("\n") || "Contact for pricing");

  if (customization.additionalInstructions) {
    systemPrompt += `\n\nADDITIONAL INSTRUCTIONS:\n${customization.additionalInstructions}`;
  }

  const vapiAssistant = await vapiClient.createAssistant({
    name: `${customization.businessName} - ${template.name}`,
    systemPrompt,
    voiceId: customization.voiceId || template.defaultVoiceId,
    workspaceId,
    tools: [...template.tools],
  });

  const agent = await prisma.voiceAgent.create({
    data: {
      workspaceId,
      name: `${customization.businessName} - ${template.name}`,
      vapiAssistantId: vapiAssistant.id,
      prompt: systemPrompt,
      voiceId: customization.voiceId || template.defaultVoiceId,
      isActive: true,
      canBook: (template.tools as readonly string[]).includes("bookAppointment"),
      canCheckStatus: (template.tools as readonly string[]).includes("checkAvailability") || (template.tools as readonly string[]).includes("checkStatus"),
      canTransfer: (template.tools as readonly string[]).includes("transferCall"),
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

  const vapiClient = getVapiClient();
  const vapiPhone = await vapiClient.createPhoneNumber({
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
  const url = new URL(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/AvailablePhoneNumbers/${countryCode}/Local.json`);

  if (areaCode) {
    url.searchParams.set("AreaCode", areaCode);
  }
  url.searchParams.set("Limit", "10");

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to search phone numbers");
  }

  const data = await response.json();

  return data.available_phone_numbers.map((n: { phone_number: string; region: string; capabilities: string[] }) => ({
    phoneNumber: n.phone_number,
    region: n.region || "Unknown",
    capabilities: n.capabilities || ["voice"],
  }));
}

export { getVapiClient };
