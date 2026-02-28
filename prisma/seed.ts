import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Create demo workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Health Clinic",
      address: "123 Healthcare Ave, Medical District, NY 10001",
      timezone: "America/New_York",
      contactEmail: "admin@acmehealth.com",
      contactPhone: "+1 (555) 123-4567",
      status: "ACTIVE",
      onboardingStep: 8,
      emailConfigured: true,
      emailFromName: "Acme Health Clinic",
      emailFromAddress: "hello@acmehealth.com",
    },
  });

  // Create demo admin user (password: demo123)
  const passwordHash = await bcrypt.hash("demo123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@acmehealth.com",
      name: "Dr. Sarah Johnson",
      passwordHash,
      role: "OWNER",
      workspaceId: workspace.id,
    },
  });

  // Create staff user (password: staff123)
  const staffHash = await bcrypt.hash("staff123", 12);
  const staff = await prisma.user.create({
    data: {
      email: "staff@acmehealth.com",
      name: "Mike Thompson",
      passwordHash: staffHash,
      role: "STAFF",
      workspaceId: workspace.id,
    },
  });

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "Initial Consultation",
        description: "First-time patient consultation and assessment",
        duration: 60,
        locationName: "Room 101",
        availableDays: "1,2,3,4,5",
        startTime: "09:00",
        endTime: "17:00",
        workspaceId: workspace.id,
      },
    }),
    prisma.service.create({
      data: {
        name: "Follow-Up Visit",
        description: "Regular follow-up appointment",
        duration: 30,
        locationName: "Room 102",
        availableDays: "1,2,3,4,5",
        startTime: "09:00",
        endTime: "17:00",
        workspaceId: workspace.id,
      },
    }),
    prisma.service.create({
      data: {
        name: "Physical Therapy Session",
        description: "One-on-one physical therapy session",
        duration: 45,
        locationName: "PT Wing",
        availableDays: "1,2,3,4",
        startTime: "08:00",
        endTime: "16:00",
        workspaceId: workspace.id,
      },
    }),
  ]);

  // Create contact form
  const contactForm = await prisma.contactForm.create({
    data: {
      name: "Contact Us",
      fields: JSON.stringify([
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: false },
        { name: "message", label: "Message", type: "textarea", required: false },
      ]),
      welcomeMessage:
        "Thank you for contacting Acme Health Clinic! We'll get back to you within 24 hours.",
      workspaceId: workspace.id,
    },
  });

  // Create intake form
  const intakeForm = await prisma.intakeForm.create({
    data: {
      name: "Patient Intake Form",
      description: "Please complete this form before your first appointment",
      fields: JSON.stringify([
        { name: "fullName", label: "Full Name", type: "text", required: true },
        { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
        { name: "medicalHistory", label: "Medical History", type: "textarea", required: false },
        { name: "allergies", label: "Known Allergies", type: "textarea", required: false },
        { name: "medications", label: "Current Medications", type: "textarea", required: false },
        { name: "emergencyContact", label: "Emergency Contact", type: "text", required: true },
      ]),
      serviceId: services[0].id,
      workspaceId: workspace.id,
    },
  });

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        name: "Emily Chen",
        email: "emily.chen@email.com",
        phone: "+1 (555) 234-5678",
        source: "form",
        workspaceId: workspace.id,
      },
    }),
    prisma.contact.create({
      data: {
        name: "James Wilson",
        email: "james.wilson@email.com",
        phone: "+1 (555) 345-6789",
        source: "booking",
        workspaceId: workspace.id,
      },
    }),
    prisma.contact.create({
      data: {
        name: "Maria Garcia",
        email: "maria.garcia@email.com",
        phone: "+1 (555) 456-7890",
        source: "form",
        workspaceId: workspace.id,
      },
    }),
    prisma.contact.create({
      data: {
        name: "Robert Kim",
        email: "robert.kim@email.com",
        phone: "+1 (555) 567-8901",
        source: "manual",
        workspaceId: workspace.id,
      },
    }),
  ]);

  // Create bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(14, 0, 0, 0);

  const today = new Date();
  today.setHours(15, 0, 0, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(11, 0, 0, 0);

  await Promise.all([
    prisma.booking.create({
      data: {
        date: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60000),
        status: "CONFIRMED",
        serviceId: services[0].id,
        contactId: contacts[0].id,
        workspaceId: workspace.id,
      },
    }),
    prisma.booking.create({
      data: {
        date: dayAfter,
        endTime: new Date(dayAfter.getTime() + 30 * 60000),
        status: "PENDING",
        serviceId: services[1].id,
        contactId: contacts[1].id,
        workspaceId: workspace.id,
      },
    }),
    prisma.booking.create({
      data: {
        date: today,
        endTime: new Date(today.getTime() + 45 * 60000),
        status: "CONFIRMED",
        serviceId: services[2].id,
        contactId: contacts[2].id,
        workspaceId: workspace.id,
      },
    }),
    prisma.booking.create({
      data: {
        date: yesterday,
        endTime: new Date(yesterday.getTime() + 60 * 60000),
        status: "COMPLETED",
        serviceId: services[0].id,
        contactId: contacts[3].id,
        workspaceId: workspace.id,
      },
    }),
  ]);

  // Create conversations with messages
  for (const contact of contacts) {
    const conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
        workspaceId: workspace.id,
        subject: `Conversation with ${contact.name}`,
        unreadCount: contact.name === "Emily Chen" ? 2 : 0,
      },
    });

    await prisma.message.create({
      data: {
        content: `Hello, I'd like to schedule an appointment at Acme Health Clinic.`,
        channel: "EMAIL",
        direction: "INBOUND",
        conversationId: conversation.id,
      },
    });

    await prisma.message.create({
      data: {
        content: `Welcome to Acme Health Clinic! Thank you for reaching out. We'd be happy to help you schedule an appointment. What type of visit are you looking for?`,
        channel: "EMAIL",
        direction: "OUTBOUND",
        isAutomated: true,
        conversationId: conversation.id,
      },
    });

    if (contact.name === "Emily Chen") {
      await prisma.message.create({
        data: {
          content: `I need an initial consultation. Do you have anything available this week?`,
          channel: "EMAIL",
          direction: "INBOUND",
          conversationId: conversation.id,
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }
  }

  // Create inventory items
  await Promise.all([
    prisma.inventoryItem.create({
      data: {
        name: "Surgical Gloves (Large)",
        description: "Latex-free surgical gloves",
        quantity: 150,
        threshold: 50,
        unit: "pairs",
        vendorName: "MedSupply Co.",
        vendorEmail: "orders@medsupply.com",
        workspaceId: workspace.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: "Face Masks",
        description: "Disposable surgical face masks",
        quantity: 30,
        threshold: 50,
        unit: "boxes",
        vendorName: "MedSupply Co.",
        vendorEmail: "orders@medsupply.com",
        workspaceId: workspace.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: "Bandages",
        description: "Sterile adhesive bandages",
        quantity: 200,
        threshold: 40,
        unit: "pieces",
        workspaceId: workspace.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: "Antiseptic Solution",
        description: "500ml antiseptic solution bottles",
        quantity: 8,
        threshold: 10,
        unit: "bottles",
        vendorName: "PharmaDirect",
        vendorEmail: "supply@pharmadirect.com",
        workspaceId: workspace.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: "Syringes",
        description: "Disposable 5ml syringes",
        quantity: 100,
        threshold: 30,
        unit: "pieces",
        workspaceId: workspace.id,
      },
    }),
  ]);

  // Create automation rules
  await Promise.all([
    prisma.automationRule.create({
      data: {
        name: "Welcome New Contact",
        trigger: "NEW_CONTACT",
        messageTemplate:
          "Welcome to Acme Health Clinic! We're glad you reached out. How can we help you today?",
        isActive: true,
        workspaceId: workspace.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: "Booking Confirmation",
        trigger: "BOOKING_CREATED",
        messageTemplate: "Your booking has been confirmed. We look forward to seeing you!",
        isActive: true,
        workspaceId: workspace.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: "Booking Reminder",
        trigger: "BEFORE_BOOKING",
        messageTemplate:
          "Reminder: You have an upcoming appointment. Please arrive 15 minutes early.",
        delayMinutes: 1440,
        isActive: true,
        workspaceId: workspace.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: "Form Reminder",
        trigger: "FORM_PENDING",
        messageTemplate:
          "You have a pending form that needs to be completed before your appointment.",
        isActive: true,
        workspaceId: workspace.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: "Low Inventory Alert",
        trigger: "INVENTORY_LOW",
        messageTemplate: "Alert: An inventory item is running low and needs to be restocked.",
        isActive: true,
        workspaceId: workspace.id,
      },
    }),
  ]);

  // Create some alerts
  await Promise.all([
    prisma.alert.create({
      data: {
        type: "booking",
        title: "New Booking",
        message: "Emily Chen booked an Initial Consultation for tomorrow",
        actionUrl: "/bookings",
        workspaceId: workspace.id,
      },
    }),
    prisma.alert.create({
      data: {
        type: "inventory",
        title: "Low Stock Alert",
        message: "Face Masks are running low (30 boxes remaining, threshold: 50)",
        actionUrl: "/inventory",
        workspaceId: workspace.id,
      },
    }),
    prisma.alert.create({
      data: {
        type: "inventory",
        title: "Low Stock Alert",
        message: "Antiseptic Solution is running low (8 bottles remaining, threshold: 10)",
        actionUrl: "/inventory",
        workspaceId: workspace.id,
      },
    }),
    prisma.alert.create({
      data: {
        type: "message",
        title: "Unread Message",
        message: "Emily Chen sent a new message",
        actionUrl: "/inbox",
        isRead: false,
        workspaceId: workspace.id,
      },
    }),
  ]);

  console.log("Seed completed!");
  console.log("");
  console.log("Demo Accounts:");
  console.log("  Admin: admin@acmehealth.com / demo123");
  console.log("  Staff: staff@acmehealth.com / staff123");
  console.log("");
  console.log(`Workspace ID: ${workspace.id}`);
  console.log(`Contact Form: /contact/${contactForm.slug}`);
  console.log(`Booking Page: /book/${workspace.id}`);
  console.log(`Intake Form: /form/${intakeForm.slug}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
