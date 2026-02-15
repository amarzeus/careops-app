import { prisma } from "./prisma";
import { sendEmail, buildEmailTemplate } from "./email";
import { sendSMS } from "./sms";
import { sendWelcomeMessage, sendBookingConfirmation, isAvailable as isWhatsAppAvailable } from "./whatsapp";
import { generateWelcomeMessage, generateBookingConfirmation } from "./gemini";
import { generateWebhookSignature, serializePayload } from "./webhook-security";
import { initiateOutboundCall, isVapiConfigured } from "./vapi";
import type { AutomationRule, Workspace } from "@prisma/client";

// SQLite doesn't support Enums, so we define it locally for type safety
export type AutomationTrigger =
  | "NEW_CONTACT"
  | "BOOKING_CREATED"
  | "BEFORE_BOOKING"
  | "FORM_PENDING"
  | "INVENTORY_LOW"
  | "STAFF_REPLY";

/**
 * Check if email is available for sending
 * Priority: 1) Workspace flag, 2) Environment variables
 * @param workspace
 */
function isEmailAvailable(workspace: Workspace): boolean {
  // If workspace flag is explicitly set, use it
  if (workspace.emailConfigured) return true;

  // Otherwise check if environment variables are configured
  const hasEmailEnv = !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
  );

  return hasEmailEnv;
}

/**
 * Check if SMS is available for sending
 * Priority: 1) Workspace flag, 2) Environment variables
 * @param workspace
 */
function isSMSAvailable(workspace: Workspace): boolean {
  // If workspace flag is explicitly set, use it
  if (workspace.smsConfigured) return true;

  // Otherwise check if environment variables are configured
  const hasSMSEnv = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );

  return hasSMSEnv;
}

/** Typed shape for automation context data */
export interface ContactData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface ServiceData {
  id: string;
  name: string;
  location?: string | null;
}

export interface BookingData {
  id: string;
  date: string | Date;
}

export interface InventoryData {
  name: string;
  quantity: number;
  threshold: number;
  unit: string;
  vendorEmail?: string | null;
}

export interface FormData {
  name: string;
}

/**
 *
 * @param workspaceId
 * @param trigger
 * @param data
 */
export async function triggerAutomation(
  workspaceId: string,
  trigger: string,
  data: Record<string, unknown>
) {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace || workspace.status !== "ACTIVE") return;

    const rulesPromise = prisma.automationRule.findMany({
      where: { workspaceId, trigger: trigger as AutomationTrigger, isActive: true },
    });

    const maybeWebhookModel = (prisma as unknown as { webhook?: { findMany?: (args: unknown) => Promise<unknown[]> } }).webhook;
    const webhooksPromise = maybeWebhookModel?.findMany
      ? maybeWebhookModel.findMany({
        where: { workspaceId, event: trigger as AutomationTrigger, isActive: true },
      })
      : Promise.resolve([]);

    const [rules, rawWebhooks] = await Promise.all([rulesPromise, webhooksPromise]);
    const webhooks = rawWebhooks as Array<{ id: string; url: string; secret: string | null }>;

    // Dispatch Webhooks with HMAC signatures and delivery logging
    webhooks.forEach(async (hook) => {
      const payload = {
        event: trigger,
        workspaceId,
        timestamp: new Date().toISOString(),
        payload: data,
      };

      const payloadString = serializePayload(payload);
      const signature = hook.secret
        ? generateWebhookSignature(payloadString, hook.secret)
        : undefined;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": trigger,
        "X-Webhook-Timestamp": payload.timestamp,
      };

      if (signature) {
        headers["X-Webhook-Signature"] = signature;
      }

      try {
        const response = await fetch(hook.url, {
          method: "POST",
          headers,
          body: payloadString,
        });

        // Log successful delivery
        await prisma.webhookDeliveryLog.create({
          data: {
            webhookId: hook.id,
            status: response.ok ? "SUCCESS" : "FAILED",
            statusCode: response.status,
            responseBody: response.ok ? null : await response.text(),
            requestBody: payloadString,
            signature: signature || null,
            workspaceId,
          },
        });
      } catch (err) {
        console.error(`Webhook failed (${hook.url}):`, err);

        // Log failed delivery
        await prisma.webhookDeliveryLog.create({
          data: {
            webhookId: hook.id,
            status: "FAILED",
            error: err instanceof Error ? err.message : String(err),
            requestBody: payloadString,
            signature: signature || null,
            workspaceId,
          },
        });
      }
    });

    for (const rule of rules) {
      // Support delayMinutes: schedule execution after delay
      if (rule.delayMinutes > 0) {
        setTimeout(() => {
          executeRule(rule, workspace, data).catch((err) =>
            console.error(`Delayed automation error (rule ${rule.id}):`, err)
          );
        }, rule.delayMinutes * 60 * 1000);
      } else {
        await executeRule(rule, workspace, data);
      }
    }
  } catch (error) {
    console.error("Automation trigger error:", error);
  }
}

/**
 *
 * @param rule
 * @param workspace
 * @param data
 */
export async function executeRule(
  rule: AutomationRule,
  workspace: Workspace,
  data: Record<string, unknown>
) {
  switch (rule.trigger) {
    case "NEW_CONTACT":
      await handleNewContact(workspace, data);
      break;
    case "BOOKING_CREATED":
      await handleBookingCreated(workspace, data);
      break;
    case "FORM_PENDING":
      await handleFormPending(workspace, data);
      break;
    case "INVENTORY_LOW":
      await handleInventoryLow(workspace, data);
      break;
    case "BEFORE_BOOKING":
      await handleBeforeBooking(workspace, data);
      break;
    case "STAFF_REPLY":
      await handleStaffReply(workspace, data);
      break;
  }
}

async function handleNewContact(workspace: Workspace, data: Record<string, unknown>) {
  const contact = data.contact as ContactData | undefined;
  if (!contact?.email && !contact?.phone) return;

  const welcomeMsg = await generateWelcomeMessage(workspace.name, contact.name);

  // Create conversation and message
  const existingConversation = await prisma.conversation.findUnique({
    where: { contactId: contact.id },
  });

  const conversation = existingConversation ?? await prisma.conversation.create({
    data: {
      contactId: contact.id,
      workspaceId: workspace.id,
      subject: `Conversation with ${contact.name}`,
    },
  });

  // Check if automation is active for this conversation
  if (conversation.isActive === false) return;

  // Determine the best channel and create the message record
  let channel: "EMAIL" | "SMS" | "WHATSAPP" = "EMAIL";

  // Send actual email
  if (contact.email && isEmailAvailable(workspace)) {
    await prisma.message.create({
      data: {
        content: welcomeMsg,
        channel: "EMAIL",
        direction: "OUTBOUND",
        isAutomated: true,
        conversationId: conversation.id,
      },
    });

    await sendEmail({
      to: contact.email,
      subject: `Welcome to ${workspace.name}`,
      html: buildEmailTemplate(
        `Welcome to ${workspace.name}`,
        `<p>${welcomeMsg}</p>`
      ),
      workspaceId: workspace.id,
    });
  }

  // Also send via WhatsApp if contact has phone and WhatsApp is configured
  if (contact.phone && isWhatsAppAvailable()) {
    channel = "WHATSAPP";
    await prisma.message.create({
      data: {
        content: welcomeMsg,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        isAutomated: true,
        conversationId: conversation.id,
      },
    });

    await sendWelcomeMessage(contact.phone, contact.name, workspace.name);
  }

  // Fallback to SMS if WhatsApp is not available but contact has phone
  if (contact.phone && !isWhatsAppAvailable() && isSMSAvailable(workspace)) {
    channel = "SMS";
    await prisma.message.create({
      data: {
        content: welcomeMsg,
        channel: "SMS",
        direction: "OUTBOUND",
        isAutomated: true,
        conversationId: conversation.id,
      },
    });

    await sendSMS({ to: contact.phone, body: welcomeMsg });
  }
}

async function handleBookingCreated(workspace: Workspace, data: Record<string, unknown>) {
  const booking = data.booking as BookingData | undefined;
  const contact = data.contact as ContactData | undefined;
  const service = data.service as ServiceData | undefined;

  if (!contact || !booking) return;
  if (!contact.email && !contact.phone) return;

  const confirmationMsg = await generateBookingConfirmation(
    workspace.name,
    contact.name,
    service?.name || "Appointment",
    new Date(booking.date).toLocaleString(),
    service?.location ?? undefined
  );

  const existingConversation = await prisma.conversation.findUnique({
    where: { contactId: contact.id },
  });

  const conversation = existingConversation ?? await prisma.conversation.create({
    data: {
      contactId: contact.id,
      workspaceId: workspace.id,
      subject: `Conversation with ${contact.name}`,
    },
  });

  // Check if automation is active for this conversation
  if (!conversation.isActive) return;

  // Send via Email
  if (contact.email && isEmailAvailable(workspace)) {
    await prisma.message.create({
      data: {
        content: confirmationMsg,
        channel: "EMAIL",
        direction: "OUTBOUND",
        isAutomated: true,
        conversationId: conversation.id,
      },
    });

    await sendEmail({
      to: contact.email,
      subject: `Booking Confirmation - ${workspace.name}`,
      html: buildEmailTemplate(
        "Booking Confirmed",
        `<p>${confirmationMsg}</p>`
      ),
      workspaceId: workspace.id,
    });
  }

  // Send via WhatsApp (if available and contact has phone)
  if (contact.phone && isWhatsAppAvailable()) {
    await prisma.message.create({
      data: {
        content: confirmationMsg,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        isAutomated: true,
        conversationId: conversation.id,
      },
    });

    await sendBookingConfirmation(
      contact.phone,
      contact.name,
      service?.name || "Appointment",
      new Date(booking.date).toLocaleString(),
      workspace.name
    );
  }

  // Fallback to SMS
  if (contact.phone && !isWhatsAppAvailable() && isSMSAvailable(workspace)) {
    await prisma.message.create({
      data: {
        content: confirmationMsg,
        channel: "SMS",
        direction: "OUTBOUND",
        isAutomated: true,
        conversationId: conversation.id,
      },
    });

    await sendSMS({ to: contact.phone, body: confirmationMsg });
  }

  // Send intake forms linked to this service
  if (service?.id) {
    const intakeForms = await prisma.intakeForm.findMany({
      where: { serviceId: service.id, isActive: true },
    });

    for (const form of intakeForms) {
      const submission = await prisma.formSubmission.create({
        data: {
          status: "SENT",
          intakeFormId: form.id,
          contactId: contact.id,
          bookingId: booking.id,
          workspaceId: workspace.id,
          sentAt: new Date(),
          dueDate: new Date(booking.date),
        },
      });

      const formUrl = `${process.env.NEXT_PUBLIC_APP_URL}/form/${form.slug}?submission=${submission.id}`;

      await prisma.message.create({
        data: {
          content: `Please complete the required form before your appointment: ${formUrl}`,
          channel: "EMAIL",
          direction: "OUTBOUND",
          isAutomated: true,
          conversationId: conversation.id,
        },
      });

      if (isEmailAvailable(workspace) && contact.email) {
        await sendEmail({
          to: contact.email,
          subject: `Action Required: ${form.name} - ${workspace.name}`,
          html: buildEmailTemplate(
            "Please Complete This Form",
            `<p>Hi ${contact.name},</p><p>Please complete the "${form.name}" form before your upcoming appointment.</p>`,
            "Complete Form",
            formUrl
          ),
          workspaceId: workspace.id,
        });
      }
    }
  }

  // Create alert
  await prisma.alert.create({
    data: {
      type: "booking",
      title: "New Booking",
      message: `${contact.name} booked ${service?.name || "an appointment"} for ${new Date(booking.date).toLocaleDateString()}`,
      actionUrl: "/bookings",
      workspaceId: workspace.id,
    },
  });
}

async function handleFormPending(workspace: Workspace, data: Record<string, unknown>) {
  const contact = data.contact as ContactData | undefined;
  const form = data.form as FormData | undefined;

  if (!contact?.email) return;

  const conversation = await prisma.conversation.findUnique({
    where: { contactId: contact.id },
  });

  if (conversation && conversation.isActive) {
    await prisma.message.create({
      data: {
        content: `Reminder: You have a pending form "${form?.name}" that needs to be completed.`,
        channel: "EMAIL",
        direction: "OUTBOUND",
        isAutomated: true,
        conversationId: conversation.id,
      },
    });
  }
}

async function handleBeforeBooking(workspace: Workspace, data: Record<string, unknown>) {
  const booking = data.booking as BookingData | undefined;
  const contact = data.contact as ContactData | undefined;
  const service = data.service as ServiceData | undefined;

  if (!contact?.email || !booking) return;

  const conversation = await prisma.conversation.findUnique({
    where: { contactId: contact.id },
  });

  if (!conversation || !conversation.isActive) return;

  const reminderMsg = `Hi ${contact.name}, this is a reminder about your upcoming ${service?.name || "appointment"} at ${new Date(booking.date).toLocaleString()}. Please arrive on time. - ${workspace.name}`;

  await prisma.message.create({
    data: {
      content: reminderMsg,
      channel: "EMAIL",
      direction: "OUTBOUND",
      isAutomated: true,
      conversationId: conversation.id,
    },
  });

  if (isEmailAvailable(workspace) && contact.email) {
    await sendEmail({
      to: contact.email,
      subject: `Reminder: Your appointment tomorrow - ${workspace.name}`,
      html: buildEmailTemplate("Appointment Reminder", `<p>${reminderMsg}</p>`),
      workspaceId: workspace.id,
    });
  }

  await prisma.alert.create({
    data: {
      type: "automation",
      title: "Booking Reminder Sent",
      message: `Reminder sent to ${contact.name} for ${service?.name || "appointment"}`,
      actionUrl: "/bookings",
      workspaceId: workspace.id,
    },
  });
}

async function handleStaffReply(workspace: Workspace, data: Record<string, unknown>) {
  const conversationId = data.conversationId as string;
  if (!conversationId) return;

  // Calculate auto-resume time (24 hours from now)
  const autoResumeAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Update conversation to pause automation with auto-resume
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      isActive: false,
      autoResumeAt: autoResumeAt
    },
  });

  // Log the automation pause
  await prisma.alert.create({
    data: {
      type: "automation",
      title: "Automation Paused",
      message: `Automated messages paused for this conversation due to staff reply. Will auto-resume at ${autoResumeAt.toLocaleString()}.`,
      actionUrl: "/inbox",
      workspaceId: workspace.id,
      isRead: true, // Don't show as unread since it's informational
    },
  });
}

async function handleInventoryLow(workspace: Workspace, data: Record<string, unknown>) {
  const item = data.item as InventoryData;

  await prisma.alert.create({
    data: {
      type: "inventory",
      title: "Low Stock Alert",
      message: `${item.name} is running low (${item.quantity} ${item.unit} remaining, threshold: ${item.threshold})`,
      actionUrl: "/inventory",
      workspaceId: workspace.id,
    },
  });

  // Email vendor if configured
  if (item.vendorEmail && isEmailAvailable(workspace)) {
    await sendEmail({
      to: item.vendorEmail,
      subject: `Reorder Request: ${item.name} - ${workspace.name}`,
      html: buildEmailTemplate(
        "Reorder Request",
        `<p>This is an automated reorder request from ${workspace.name}.</p><p>Item: ${item.name}<br>Current quantity: ${item.quantity} ${item.unit}<br>Threshold: ${item.threshold} ${item.unit}</p>`
      ),
      workspaceId: workspace.id,
    });
  }
}

/**
 *
 * @param conversationId
 * @param workspaceId
 */
export async function resumeAutomation(conversationId: string, workspaceId: string) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { isActive: true },
  });

  await prisma.alert.create({
    data: {
      type: "automation",
      title: "Automation Resumed",
      message: `Automated messages have been resumed for this conversation`,
      actionUrl: "/inbox",
      workspaceId,
    },
  });
}

/**
 *
 * @param workspaceId
 * @param workspaceName
 * @param contactPhone
 * @param contactName
 * @param serviceName
 * @param bookingDate
 */
export async function sendVoiceCallReminder(
  workspaceId: string,
  workspaceName: string,
  contactPhone: string,
  contactName: string,
  serviceName: string,
  bookingDate: Date
): Promise<{ success: boolean; callId?: string; error?: string }> {
  if (!isVapiConfigured()) {
    console.log('[VoiceReminder] VAPI not configured, skipping voice call');
    return { success: false, error: 'VAPI not configured' };
  }

  if (!contactPhone) {
    return { success: false, error: 'No phone number available' };
  }

  const message = `Hi ${contactName}, this is a reminder from ${workspaceName || 'our business'} about your upcoming ${serviceName} appointment on ${bookingDate.toLocaleDateString()} at ${bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please call us if you need to reschedule. Thank you.`;

  const result = await initiateOutboundCall({
    phoneNumber: contactPhone,
    workspaceId,
    contactName,
    metadata: {
      purpose: 'reminder',
      serviceName,
      bookingDate: bookingDate.toISOString(),
    },
  });

  if (result.success) {
    await prisma.voiceCall.create({
      data: {
        callSid: result.callId,
        direction: 'OUTBOUND',
        status: 'INITIATED',
        workspaceId,
        outcome: 'REMINDER_SENT',
        metadata: JSON.stringify({ purpose: 'reminder', serviceName }),
      },
    });
  }

  return result;
}

/**
 *
 * @param workspaceId
 * @param workspaceName
 * @param contactPhone
 * @param contactName
 * @param serviceName
 * @param bookingDate
 */
export async function sendVoiceCallConfirmation(
  workspaceId: string,
  workspaceName: string,
  contactPhone: string,
  contactName: string,
  serviceName: string,
  bookingDate: Date
): Promise<{ success: boolean; callId?: string; error?: string }> {
  if (!isVapiConfigured()) {
    console.log('[VoiceConfirmation] VAPI not configured, skipping voice call');
    return { success: false, error: 'VAPI not configured' };
  }

  if (!contactPhone) {
    return { success: false, error: 'No phone number available' };
  }

  const message = `Hi ${contactName}, this is a confirmation from ${workspaceName || 'our business'}. Your ${serviceName} appointment has been booked for ${bookingDate.toLocaleDateString()} at ${bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. We look forward to seeing you. Thank you.`;

  const result = await initiateOutboundCall({
    phoneNumber: contactPhone,
    workspaceId,
    contactName,
    metadata: {
      purpose: 'confirmation',
      serviceName,
      bookingDate: bookingDate.toISOString(),
    },
  });

  if (result.success) {
    await prisma.voiceCall.create({
      data: {
        callSid: result.callId,
        direction: 'OUTBOUND',
        status: 'INITIATED',
        workspaceId,
        outcome: 'CONFIRMATION_SENT',
        metadata: JSON.stringify({ purpose: 'confirmation', serviceName }),
      },
    });
  }

  return result;
}

/**
 *
 * @param workspaceId
 * @param workspaceName
 * @param contactPhone
 * @param contactName
 * @param serviceName
 */
export async function sendVoiceCallFollowUp(
  workspaceId: string,
  workspaceName: string,
  contactPhone: string,
  contactName: string,
  serviceName?: string
): Promise<{ success: boolean; callId?: string; error?: string }> {
  if (!isVapiConfigured()) {
    return { success: false, error: 'VAPI not configured' };
  }

  if (!contactPhone) {
    return { success: false, error: 'No phone number available' };
  }

  const servicePart = serviceName ? ` about your recent ${serviceName} visit` : '';
  const message = `Hi ${contactName}, this is a follow-up call from ${workspaceName || 'our business'}${servicePart}. We wanted to check if everything went well and if there's anything else we can help you with. Please call us back at your convenience. Thank you.`;

  const result = await initiateOutboundCall({
    phoneNumber: contactPhone,
    workspaceId,
    contactName,
    metadata: {
      purpose: 'follow_up',
      serviceName,
    },
  });

  if (result.success) {
    await prisma.voiceCall.create({
      data: {
        callSid: result.callId,
        direction: 'OUTBOUND',
        status: 'INITIATED',
        workspaceId,
        outcome: 'FOLLOW_UP_INITIATED',
        metadata: JSON.stringify({ purpose: 'follow_up', serviceName }),
      },
    });
  }

  return result;
}

/**
 *
 * @param workspaceId
 * @param trigger
 * @param data
 * @param data.contactPhone
 * @param data.contactName
 * @param data.serviceName
 * @param data.bookingDate
 * @param data.workspaceName
 */
export async function triggerVoiceAutomation(
  workspaceId: string,
  trigger: 'VOICE_REMINDER' | 'VOICE_CONFIRMATION' | 'VOICE_FOLLOW_UP',
  data: {
    contactPhone?: string;
    contactName?: string;
    serviceName?: string;
    bookingDate?: Date;
    workspaceName?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!data.contactPhone || !data.contactName) {
    return { success: false, error: 'Missing contact information' };
  }

  const workspaceName = data.workspaceName || 'Our Business';

  switch (trigger) {
    case 'VOICE_REMINDER':
      if (!data.bookingDate || !data.serviceName) {
        return { success: false, error: 'Missing booking information for reminder' };
      }
      return sendVoiceCallReminder(
        workspaceId,
        workspaceName,
        data.contactPhone,
        data.contactName,
        data.serviceName,
        data.bookingDate
      );

    case 'VOICE_CONFIRMATION':
      if (!data.bookingDate || !data.serviceName) {
        return { success: false, error: 'Missing booking information for confirmation' };
      }
      return sendVoiceCallConfirmation(
        workspaceId,
        workspaceName,
        data.contactPhone,
        data.contactName,
        data.serviceName,
        data.bookingDate
      );

    case 'VOICE_FOLLOW_UP':
      return sendVoiceCallFollowUp(
        workspaceId,
        workspaceName,
        data.contactPhone,
        data.contactName,
        data.serviceName
      );

    default:
      return { success: false, error: 'Unknown voice trigger' };
  }
}
