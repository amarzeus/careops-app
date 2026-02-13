import { prisma } from "./prisma";
import { sendEmail, buildEmailTemplate } from "./email";
import { sendSMS } from "./sms";
import { sendWelcomeMessage, sendBookingConfirmation, isAvailable as isWhatsAppAvailable } from "./whatsapp";
import { generateWelcomeMessage, generateBookingConfirmation } from "./gemini";
import type { AutomationRule, Workspace, AutomationTrigger } from "@prisma/client";

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

    const [rules, webhooks] = await Promise.all([
      prisma.automationRule.findMany({
        where: { workspaceId, trigger: trigger as AutomationTrigger, isActive: true },
      }),
      prisma.webhook.findMany({
        where: { workspaceId, event: trigger as AutomationTrigger, isActive: true },
      }),
    ]);

    // Dispatch Webhooks (Fire-and-forget)
    webhooks.forEach((hook) => {
      fetch(hook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: trigger,
          workspaceId,
          timestamp: new Date().toISOString(),
          payload: data,
        }),
      }).catch((err) => console.error(`Webhook failed (${hook.url}):`, err));
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
  let conversation = await prisma.conversation.findUnique({
    where: { contactId: contact.id },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
        workspaceId: workspace.id,
        subject: `Conversation with ${contact.name}`,
      },
    });
  }

  // Check if automation is active for this conversation
  if (!conversation.isActive) return;

  // Determine the best channel and create the message record
  let channel: "EMAIL" | "SMS" | "WHATSAPP" = "EMAIL";

  // Send actual email
  if (contact.email && workspace.emailConfigured) {
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
  if (contact.phone && !isWhatsAppAvailable() && workspace.smsConfigured) {
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

  let conversation = await prisma.conversation.findUnique({
    where: { contactId: contact.id },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
        workspaceId: workspace.id,
        subject: `Conversation with ${contact.name}`,
      },
    });
  }

  // Check if automation is active for this conversation
  if (!conversation.isActive) return;

  // Send via Email
  if (contact.email && workspace.emailConfigured) {
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
  if (contact.phone && !isWhatsAppAvailable() && workspace.smsConfigured) {
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

      if (workspace.emailConfigured) {
        await sendEmail({
          to: contact.email,
          subject: `Action Required: ${form.name} - ${workspace.name}`,
          html: buildEmailTemplate(
            "Please Complete This Form",
            `<p>Hi ${contact.name},</p><p>Please complete the "${form.name}" form before your upcoming appointment.</p>`,
            "Complete Form",
            formUrl
          ),
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

  let conversation = await prisma.conversation.findUnique({
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
  
  if (workspace.emailConfigured) {
    await sendEmail({
      to: contact.email,
      subject: `Reminder: Your appointment tomorrow - ${workspace.name}`,
      html: buildEmailTemplate("Appointment Reminder", `<p>${reminderMsg}</p>`),
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

  // Update conversation to pause automation
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { isActive: false },
  });
  
  // Log the automation pause
  await prisma.alert.create({
    data: {
      type: "automation",
      title: "Automation Paused",
      message: `Automated messages paused for this conversation due to staff reply`,
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
  if (item.vendorEmail && workspace.emailConfigured) {
    await sendEmail({
      to: item.vendorEmail,
      subject: `Reorder Request: ${item.name} - ${workspace.name}`,
      html: buildEmailTemplate(
        "Reorder Request",
        `<p>This is an automated reorder request from ${workspace.name}.</p><p>Item: ${item.name}<br>Current quantity: ${item.quantity} ${item.unit}<br>Threshold: ${item.threshold} ${item.unit}</p>`
      ),
    });
  }
}
