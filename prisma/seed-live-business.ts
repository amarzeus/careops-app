import { PrismaClient } from "@prisma/client";
import { subDays, subHours } from "date-fns";

const prisma = new PrismaClient();

/**
 *
 */
async function main() {
  console.log("🌱 Starting CareOps Live Business Seeding...");

  // ============================================
  // 1. WORKSPACE & ROLES (Section 3 & 4)
  // ============================================
  console.log("\n📍 Creating Workspace & Users...");

  // Create or get existing Workspace
  let workspace = await prisma.workspace.findFirst({ where: { name: "Zeus Wellness Center" } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Zeus Wellness Center",
        address: "123 Health Avenue, Medical District",
        timezone: "America/New_York",
        contactEmail: "admin@zeuswellness.com",
        contactPhone: "+1-555-0100",
        status: "ACTIVE",
        emailConfigured: true,
        smsConfigured: false,
      },
    });
  }
  console.log(`   ✓ Workspace: ${workspace.name}`);

  // Create or update Owner (Full Access)
  const owner = await prisma.user.upsert({
    where: { email: "amar@zeuswellness.com" },
    update: {
      passwordHash: "$2b$12$1Tq3aKgQ3.Nq4jcAkZYeeOFBKXvu2anpnGZCrHwMxypmKZ/.kQ9wO",
      emailVerified: new Date(),
    },
    create: {
      email: "amar@zeuswellness.com",
      name: "Amar Kumar",
      passwordHash: "$2b$12$1Tq3aKgQ3.Nq4jcAkZYeeOFBKXvu2anpnGZCrHwMxypmKZ/.kQ9wO", // password
      role: "OWNER",
      emailVerified: new Date(),
      workspaceId: workspace.id,
    },
  });
  console.log(`   ✓ Owner: ${owner.name} (${owner.email})`);

  // Create or update Staff Users (Restricted Access)
  const staffAlpha = await prisma.user.upsert({
    where: { email: "alpha@zeuswellness.com" },
    update: {
      passwordHash: "$2b$12$1Tq3aKgQ3.Nq4jcAkZYeeOFBKXvu2anpnGZCrHwMxypmKZ/.kQ9wO",
      emailVerified: new Date(),
    },
    create: {
      email: "alpha@zeuswellness.com",
      name: "Staff Alpha",
      passwordHash: "$2b$12$1Tq3aKgQ3.Nq4jcAkZYeeOFBKXvu2anpnGZCrHwMxypmKZ/.kQ9wO", // password
      role: "STAFF",
      emailVerified: new Date(),
      workspaceId: workspace.id,
    },
  });

  const staffBeta = await prisma.user.upsert({
    where: { email: "beta@zeuswellness.com" },
    update: {
      passwordHash: "$2b$12$1Tq3aKgQ3.Nq4jcAkZYeeOFBKXvu2anpnGZCrHwMxypmKZ/.kQ9wO",
      emailVerified: new Date(),
    },
    create: {
      email: "beta@zeuswellness.com",
      name: "Staff Beta",
      passwordHash: "$2b$12$1Tq3aKgQ3.Nq4jcAkZYeeOFBKXvu2anpnGZCrHwMxypmKZ/.kQ9wO", // password
      role: "STAFF",
      emailVerified: new Date(),
      workspaceId: workspace.id,
    },
  });
  console.log(`   ✓ Staff: ${staffAlpha.name}, ${staffBeta.name}`);

  // ============================================
  // 2. SERVICE TYPES (Section 4)
  // ============================================
  console.log("\n📋 Creating Service Types...");

  const generalConsultation = await prisma.service.create({
    data: {
      workspaceId: workspace.id,
      name: "General Consultation",
      duration: 60,
      price: 150,
      description: "Standard health consultation appointment",
      isActive: true,
    },
  });

  const therapySession = await prisma.service.create({
    data: {
      workspaceId: workspace.id,
      name: "Therapy Session",
      duration: 45,
      price: 120,
      description: "One-on-one therapy session",
      isActive: true,
    },
  });

  const emergencyFollowUp = await prisma.service.create({
    data: {
      workspaceId: workspace.id,
      name: "Emergency Follow-up",
      duration: 30,
      price: 75,
      description: "Quick follow-up for urgent cases",
      isActive: true,
    },
  });
  console.log(
    `   ✓ Services: ${generalConsultation.name} (${generalConsultation.duration}m), ${therapySession.name} (${therapySession.duration}m), ${emergencyFollowUp.name} (${emergencyFollowUp.duration}m)`
  );

  // ============================================
  // 3. CONTACTS & CONVERSATIONS (Section 6)
  // ============================================
  console.log("\n💬 Creating Contacts & Conversations...");

  const contacts = [];
  const contactData = [
    { name: "Sarah Johnson", email: "sarah.j@email.com", phone: "+1-555-0101" },
    { name: "Michael Chen", email: "mchen@email.com", phone: "+1-555-0102" },
    { name: "Emily Davis", email: "emily.d@email.com", phone: "+1-555-0103" },
    { name: "Robert Wilson", email: "rwilson@email.com", phone: "+1-555-0104" },
    { name: "Lisa Anderson", email: "lisa.a@email.com", phone: "+1-555-0105" },
  ];

  for (const data of contactData) {
    const contact = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        source: "FORM",
      },
    });
    contacts.push(contact);

    // Create Conversation for each contact
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact.id,
        isActive: true,
      },
    });

    // Add message history (3-5 messages per conversation)
    const messageCount = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < messageCount; i++) {
      const isInbound = i % 2 === 0;
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: isInbound ? "INBOUND" : "OUTBOUND",
          channel: "EMAIL",
          content: isInbound
            ? `Hi, I'm interested in booking an appointment. Is there availability this week? (Message ${i + 1})`
            : `Hello! Thank you for reaching out. We have availability this week. Would you like to book a consultation? (Reply ${i + 1})`,
          status: "DELIVERED",
          createdAt: subHours(new Date(), i * 2),
        },
      });
    }
    console.log(`   ✓ Contact: ${contact.name} with ${messageCount} messages`);
  }

  // ============================================
  // 4. BOOKINGS (Section 5 & 8)
  // ============================================
  console.log("\n📅 Creating Bookings...");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = subDays(today, 1);

  // Helper to add minutes
  const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);

  // 3 Upcoming bookings for TODAY
  const upcomingData = [
    { contactIndex: 0, service: generalConsultation, time: "10:00", status: "CONFIRMED" },
    { contactIndex: 1, service: therapySession, time: "14:00", status: "PENDING" },
    { contactIndex: 2, service: emergencyFollowUp, time: "16:30", status: "CONFIRMED" },
  ];

  const createdBookings = [];
  for (const b of upcomingData) {
    const [hours, minutes] = b.time.split(":").map(Number);
    const bookingDate = new Date(today);
    bookingDate.setHours(hours, minutes, 0, 0);

    const booking = await prisma.booking.create({
      data: {
        workspaceId: workspace.id,
        contactId: contacts[b.contactIndex].id,
        serviceId: b.service.id,
        date: bookingDate,
        endTime: addMinutes(bookingDate, b.service.duration),
        status: b.status,
        notes: `Scheduled ${b.service.name}`,
      },
    });
    createdBookings.push(booking);
    console.log(`   ✓ Upcoming: ${contacts[b.contactIndex].name} - ${b.service.name} (${b.time})`);
  }

  // 2 Completed bookings for YESTERDAY
  const completedData = [
    { contactIndex: 3, service: generalConsultation, time: "09:00" },
    { contactIndex: 4, service: therapySession, time: "11:00" },
  ];

  const completedBookings = [];
  for (const b of completedData) {
    const [hours, minutes] = b.time.split(":").map(Number);
    const bookingDate = new Date(yesterday);
    bookingDate.setHours(hours, minutes, 0, 0);

    const booking = await prisma.booking.create({
      data: {
        workspaceId: workspace.id,
        contactId: contacts[b.contactIndex].id,
        serviceId: b.service.id,
        date: bookingDate,
        endTime: addMinutes(bookingDate, b.service.duration),
        status: "COMPLETED",
        notes: `Completed ${b.service.name}`,
      },
    });
    completedBookings.push(booking);
    console.log(`   ✓ Completed: ${contacts[b.contactIndex].name} - ${b.service.name}`);
  }

  // 1 No-Show booking for YESTERDAY
  const noShowDate = new Date(yesterday);
  noShowDate.setHours(15, 0, 0, 0);
  await prisma.booking.create({
    data: {
      workspaceId: workspace.id,
      contactId: contacts[0].id,
      serviceId: emergencyFollowUp.id,
      date: noShowDate,
      endTime: addMinutes(noShowDate, emergencyFollowUp.duration),
      status: "NO_SHOW",
      notes: "Client did not arrive",
    },
  });
  console.log(`   ✓ No-Show: ${contacts[0].name} - ${emergencyFollowUp.name}`);

  // ============================================
  // 5. INTAKE FORMS & SUBMISSIONS (Section 5)
  // ============================================
  console.log("\n📄 Creating Intake Forms & Submissions...");

  // Create Intake Forms
  const intakeForm1 = await prisma.intakeForm.create({
    data: {
      workspaceId: workspace.id,
      name: "Patient Intake Form",
      description: "Standard patient intake questionnaire",
      serviceId: generalConsultation.id,
      isActive: true,
    },
  });

  const intakeForm2 = await prisma.intakeForm.create({
    data: {
      workspaceId: workspace.id,
      name: "Therapy Agreement",
      description: "Terms and conditions for therapy sessions",
      serviceId: therapySession.id,
      isActive: true,
    },
  });
  console.log(`   ✓ Intake Forms: ${intakeForm1.name}, ${intakeForm2.name}`);

  // Create Form Submissions - Pending
  await prisma.formSubmission.create({
    data: {
      workspaceId: workspace.id,
      contactId: contacts[0].id,
      bookingId: createdBookings[0].id,
      intakeFormId: intakeForm1.id,
      status: "PENDING",
      sentAt: subDays(today, 1),
    },
  });
  console.log(`   ✓ Pending: ${contacts[0].name} - ${intakeForm1.name} (PENDING)`);

  await prisma.formSubmission.create({
    data: {
      workspaceId: workspace.id,
      contactId: contacts[1].id,
      bookingId: createdBookings[1].id,
      intakeFormId: intakeForm1.id,
      status: "SENT",
      sentAt: subDays(today, 1),
    },
  });
  console.log(`   ✓ Pending: ${contacts[1].name} - ${intakeForm1.name} (SENT)`);

  // Create Form Submission - Overdue
  await prisma.formSubmission.create({
    data: {
      workspaceId: workspace.id,
      contactId: contacts[3].id,
      bookingId: completedBookings[0].id,
      intakeFormId: intakeForm2.id,
      status: "OVERDUE",
      sentAt: subDays(yesterday, 3),
      dueDate: subDays(yesterday, 1),
    },
  });
  console.log(`   ✓ Overdue: ${contacts[3].name} - ${intakeForm2.name}`);

  // ============================================
  // 6. INVENTORY (Section 10)
  // ============================================
  console.log("\n📦 Creating Inventory...");

  const medicalKit = await prisma.inventoryItem.create({
    data: {
      workspaceId: workspace.id,
      name: "Medical Kits",
      quantity: 6,
      threshold: 5,
      unit: "kits",
      vendorName: "Medical Supply Co.",
      vendorPhone: "+1-555-0200",
    },
  });
  console.log(
    `   ✓ Item: ${medicalKit.name} (Qty: ${medicalKit.quantity}, Threshold: ${medicalKit.threshold})`
  );

  // Map to service - create service inventory link
  await prisma.serviceInventoryLink.create({
    data: {
      serviceId: generalConsultation.id,
      inventoryId: medicalKit.id,
      quantity: 1,
    },
  });
  console.log(`   ✓ Mapped: ${generalConsultation.name} uses ${medicalKit.name}`);

  // Create Inventory Log
  await prisma.inventoryLog.create({
    data: {
      itemId: medicalKit.id,
      previousQty: 10,
      newQty: 6,
      change: -4,
      reason: "booking_completed",
      referenceType: "booking",
      referenceId: completedBookings[0].id,
      workspaceId: workspace.id,
    },
  });

  // ============================================
  // 7. AUTOMATION RULES & LOGS (Section 9 & 11)
  // ============================================
  console.log("\n🤖 Creating Automation Rules & Failed Logs...");

  // Create automation rules
  const bookingRule = await prisma.automationRule.create({
    data: {
      workspaceId: workspace.id,
      name: "Booking Confirmation",
      trigger: "BOOKING_CREATED",
      messageTemplate: "Your booking is confirmed for {{date}}",
      isActive: true,
    },
  });

  const formRule = await prisma.automationRule.create({
    data: {
      workspaceId: workspace.id,
      name: "Form Reminder",
      trigger: "FORM_SENT",
      messageTemplate: "Please complete your intake form",
      isActive: true,
    },
  });

  // Log failed email attempts (PRD Section 11 - Failures must be logged)
  await prisma.automationLog.create({
    data: {
      ruleId: bookingRule.id,
      trigger: "BOOKING_CREATED",
      status: "FAILED",
      details: JSON.stringify({
        error: "SMTP connection timeout - server not responding",
        channel: "EMAIL",
      }),
      recipient: "sarah.j@email.com",
      createdAt: subHours(today, 2),
    },
  });

  await prisma.automationLog.create({
    data: {
      ruleId: bookingRule.id,
      trigger: "BOOKING_CREATED",
      status: "FAILED",
      details: JSON.stringify({ error: "Invalid recipient email address", channel: "EMAIL" }),
      recipient: "invalid-email@test",
      createdAt: subHours(today, 5),
    },
  });

  // Log failed SMS attempt
  await prisma.automationLog.create({
    data: {
      ruleId: formRule.id,
      trigger: "FORM_SENT",
      status: "FAILED",
      details: JSON.stringify({ error: "Twilio API rate limit exceeded", channel: "SMS" }),
      recipient: "+1-555-0101",
      createdAt: subHours(today, 1),
    },
  });
  console.log(`   ✓ Failed Logs: 2 Email failures, 1 SMS failure`);

  // Also create Integration Logs for visibility (PRD Section 11)
  await prisma.integrationLog.create({
    data: {
      workspaceId: workspace.id,
      type: "email",
      status: "failed",
      to: "sarah.j@email.com",
      message: "Booking confirmation email",
      error: "SMTP connection timeout",
      createdAt: subHours(today, 2),
    },
  });

  await prisma.integrationLog.create({
    data: {
      workspaceId: workspace.id,
      type: "sms",
      status: "failed",
      to: "+1-555-0101",
      message: "Form reminder SMS",
      error: "Twilio API rate limit exceeded",
      createdAt: subHours(today, 1),
    },
  });

  // ============================================
  // 8. PUBLIC PAGES (Section 7)
  // ============================================
  console.log("\n🌐 Creating Public Pages...");

  // Create Contact Form (public)
  const contactForm = await prisma.contactForm.create({
    data: {
      workspaceId: workspace.id,
      name: "Contact Us",
      slug: "contact-zeus",
      welcomeMessage:
        "Thank you for reaching out to Zeus Wellness Center. We will get back to you within 24 hours.",
      isActive: true,
    },
  });
  console.log(`   ✓ Contact Form: /contact/${contactForm.slug}`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n✅ CareOps Live Business Seeding Complete!\n");
  console.log("📊 Dashboard Metrics to Verify:");
  console.log(`   - Today's Bookings: 3 (2 Confirmed, 1 Pending)`);
  console.log(`   - Yesterday: 2 Completed, 1 No-Show`);
  console.log(`   - Pending Forms: 2`);
  console.log(`   - Overdue Forms: 1`);
  console.log(`   - Inventory: 1 Critical (Medical Kits: 6/5)`);
  console.log(`   - Failed Logs: 3 (verifiable in automation)`);
  console.log("\n🔐 Test Credentials:");
  console.log(`   Owner: ${owner.email} / password`);
  console.log(`   Staff: ${staffAlpha.email} / password`);
  console.log(`   Staff: ${staffBeta.email} / password`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
