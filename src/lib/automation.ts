import { prisma } from "./prisma";
import { sendEmail, buildEmailTemplate } from "./email";
import { generateWelcomeMessage, generateBookingConfirmation } from "./gemini";

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

    const rules = await prisma.automationRule.findMany({
      where: { workspaceId, trigger: trigger as any, isActive: true },
    });

    for (const rule of rules) {
      await executeRule(rule, workspace, data);
    }
  } catch (error) {
    console.error("Automation trigger error:", error);
  }
}

async function executeRule(
  rule: any,
  workspace: any,
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
  }
}

async function handleNewContact(workspace: any, data: Record<string, unknown>) {
  const contact = data.contact as any;
  if (!contact?.email) return;

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

  await prisma.message.create({
    data: {
      content: welcomeMsg,
      channel: "EMAIL",
      direction: "OUTBOUND",
      isAutomated: true,
      conversationId: conversation.id,
    },
  });

  // Send actual email
  if (workspace.emailConfigured) {
    await sendEmail({
      to: contact.email,
      subject: `Welcome to ${workspace.name}`,
      html: buildEmailTemplate(
        `Welcome to ${workspace.name}`,
        `<p>${welcomeMsg}</p>`
      ),
    });
  }
}

async function handleBookingCreated(workspace: any, data: Record<string, unknown>) {
  const booking = data.booking as any;
  const contact = data.contact as any;
  const service = data.service as any;

  if (!contact?.email) return;

  const confirmationMsg = await generateBookingConfirmation(
    workspace.name,
    contact.name,
    service?.name || "Appointment",
    new Date(booking.date).toLocaleString(),
    service?.location
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

  await prisma.message.create({
    data: {
      content: confirmationMsg,
      channel: "EMAIL",
      direction: "OUTBOUND",
      isAutomated: true,
      conversationId: conversation.id,
    },
  });

  if (workspace.emailConfigured) {
    await sendEmail({
      to: contact.email,
      subject: `Booking Confirmation - ${workspace.name}`,
      html: buildEmailTemplate(
        "Booking Confirmed",
        `<p>${confirmationMsg}</p>`
      ),
    });
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

async function handleFormPending(workspace: any, data: Record<string, unknown>) {
  const contact = data.contact as any;
  const form = data.form as any;

  if (!contact?.email) return;

  let conversation = await prisma.conversation.findUnique({
    where: { contactId: contact.id },
  });

  if (conversation) {
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

async function handleInventoryLow(workspace: any, data: Record<string, unknown>) {
  const item = data.item as any;

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
