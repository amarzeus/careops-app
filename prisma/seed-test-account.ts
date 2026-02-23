/**
 * seed-test-account.ts
 * Creates a fresh "CareOps Test Clinic" workspace with extensive test data
 * for deep PRD workflow testing.
 *
 * Owner:  testowner@careops.test / Test@1234
 * Staff:  5 staff members with varying permissions
 * Data:   20 contacts, 12 bookings, 8 inventory items, 6 automation rules,
 *         3 forms, voice agent, alerts, conversations, messages
 *
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed-test-account.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays, subHours, addDays } from "date-fns";

const prisma = new PrismaClient();

/**
 *
 */
async function main() {
  console.log("🌱 CareOps Deep Test Seed Starting...\n");

  // ─────────────────────────────────────────────
  // 1. CLEANUP: remove existing test workspace
  // ─────────────────────────────────────────────
  const existing = await prisma.workspace.findFirst({
    where: { name: "CareOps Test Clinic" },
  });
  if (existing) {
    console.log("🗑  Removing existing test workspace...");
    // Cascade-delete order: messages → conversations → formSubmissions →
    //   automationLogs → automationRules → bookings → contacts →
    //   intakeForms → contactForms → inventoryLogs → serviceInventoryLinks →
    //   inventoryItems → services → alerts → integrationLogs → users → workspace
    await prisma.message.deleteMany({ where: { conversation: { workspaceId: existing.id } } });
    await prisma.conversation.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.formSubmission.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.automationLog.deleteMany({ where: { rule: { workspaceId: existing.id } } });
    await prisma.automationRule.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.booking.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.contact.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.intakeForm.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.contactForm.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.inventoryLog.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.serviceInventoryLink.deleteMany({
      where: { service: { workspaceId: existing.id } },
    });
    await prisma.inventoryItem.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.service.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.alert.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.integrationLog.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.aIPreferences.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.user.deleteMany({ where: { workspaceId: existing.id } });
    await prisma.workspace.delete({ where: { id: existing.id } });
    console.log("   ✓ Cleaned up\n");
  }

  const passwordHash = await bcrypt.hash("Test@1234", 12);
  const staffHash = await bcrypt.hash("Staff@1234", 12);

  // ─────────────────────────────────────────────
  // 2. WORKSPACE
  // ─────────────────────────────────────────────
  console.log("🏥 Creating Workspace...");
  const workspace = await prisma.workspace.create({
    data: {
      name: "CareOps Test Clinic",
      address: "42 Wellness Boulevard, Suite 200, San Francisco, CA 94102",
      timezone: "America/Los_Angeles",
      contactEmail: "contact@careops-clinic.test",
      contactPhone: "+1-415-555-0100",
      status: "ACTIVE",
      emailConfigured: false,
      smsConfigured: false,
    },
  });
  console.log(`   ✓ Workspace: ${workspace.name} (ID: ${workspace.id})`);

  // ─────────────────────────────────────────────
  // 3. USERS — 1 owner + 5 staff
  // ─────────────────────────────────────────────
  console.log("\n👥 Creating Users (1 owner + 5 staff)...");

  const owner = await prisma.user.create({
    data: {
      email: "testowner@careops.test",
      name: "Alex Rivera",
      passwordHash,
      role: "OWNER",
      emailVerified: new Date(),
      workspaceId: workspace.id,
    },
  });
  console.log(`   ✓ OWNER: ${owner.name} <${owner.email}> / Test@1234`);

  const staffData = [
    {
      email: "jordan.smith@careops.test",
      name: "Jordan Smith",
      canInbox: true,
      canBookings: true,
      canForms: true,
      canInventory: false,
    },
    {
      email: "casey.lee@careops.test",
      name: "Casey Lee",
      canInbox: true,
      canBookings: false,
      canForms: true,
      canInventory: true,
    },
    {
      email: "morgan.chen@careops.test",
      name: "Morgan Chen",
      canInbox: false,
      canBookings: true,
      canForms: false,
      canInventory: true,
    },
    {
      email: "riley.patel@careops.test",
      name: "Riley Patel",
      canInbox: true,
      canBookings: true,
      canForms: true,
      canInventory: true,
    },
    {
      email: "drew.kim@careops.test",
      name: "Drew Kim",
      canInbox: false,
      canBookings: false,
      canForms: true,
      canInventory: false,
    },
  ];

  const staffMembers = [];
  for (const s of staffData) {
    const staff = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash: staffHash,
        role: "STAFF",
        emailVerified: new Date(),
        workspaceId: workspace.id,
        canAccessInbox: s.canInbox,
        canAccessBookings: s.canBookings,
        canAccessForms: s.canForms,
        canAccessInventory: s.canInventory,
      },
    });
    staffMembers.push(staff);
    console.log(`   ✓ STAFF: ${staff.name} <${staff.email}> / Staff@1234`);
  }

  // ─────────────────────────────────────────────
  // 4. SERVICES
  // ─────────────────────────────────────────────
  console.log("\n🩺 Creating Services...");
  const servicesData = [
    {
      name: "General Consultation",
      duration: 60,
      price: 150,
      desc: "Standard health consultation",
    },
    {
      name: "Physical Therapy",
      duration: 45,
      price: 120,
      desc: "Physiotherapy and rehabilitation",
    },
    {
      name: "Mental Health Assessment",
      duration: 90,
      price: 200,
      desc: "Psychological evaluation",
    },
    { name: "Nutritional Counseling", duration: 30, price: 80, desc: "Personalized diet planning" },
    { name: "Emergency Follow-up", duration: 20, price: 50, desc: "Urgent care follow-up" },
  ];
  const services = [];
  for (const s of servicesData) {
    const svc = await prisma.service.create({
      data: {
        workspaceId: workspace.id,
        name: s.name,
        description: s.desc,
        duration: s.duration,
        price: s.price,
        isActive: true,
        availableDays: "1,2,3,4,5",
        startTime: "09:00",
        endTime: "18:00",
      },
    });
    services.push(svc);
    console.log(`   ✓ ${svc.name} (${svc.duration}min, $${svc.price})`);
  }

  // ─────────────────────────────────────────────
  // 5. CONTACTS — 20 contacts with conversations
  // ─────────────────────────────────────────────
  console.log("\n📋 Creating 20 Contacts + Conversations...");
  const contactsData = [
    {
      name: "Olivia Hartman",
      email: "olivia.h@gmail.com",
      phone: "+1-415-555-0201",
      source: "form",
    },
    {
      name: "Ethan Nguyen",
      email: "ethan.n@email.com",
      phone: "+1-415-555-0202",
      source: "referral",
    },
    {
      name: "Sophia Patel",
      email: "sophia.p@outlook.com",
      phone: "+1-415-555-0203",
      source: "form",
    },
    { name: "Liam Okafor", email: "liam.o@gmail.com", phone: "+1-415-555-0204", source: "search" },
    {
      name: "Ava Thompson",
      email: "ava.t@email.com",
      phone: "+1-415-555-0205",
      source: "referral",
    },
    { name: "Noah Castillo", email: "noah.c@gmail.com", phone: "+1-415-555-0206", source: "form" },
    {
      name: "Isabella Kim",
      email: "isabella.k@outlook.com",
      phone: "+1-415-555-0207",
      source: "search",
    },
    {
      name: "Mason Fernandez",
      email: "mason.f@email.com",
      phone: "+1-415-555-0208",
      source: "form",
    },
    { name: "Mia Johnson", email: "mia.j@gmail.com", phone: "+1-415-555-0209", source: "referral" },
    {
      name: "James Williams",
      email: "james.w@email.com",
      phone: "+1-415-555-0210",
      source: "form",
    },
    {
      name: "Charlotte Brown",
      email: "charlotte.b@gmail.com",
      phone: "+1-415-555-0211",
      source: "search",
    },
    {
      name: "Benjamin Davis",
      email: "ben.d@outlook.com",
      phone: "+1-415-555-0212",
      source: "form",
    },
    {
      name: "Amelia Martinez",
      email: "amelia.m@email.com",
      phone: "+1-415-555-0213",
      source: "referral",
    },
    {
      name: "Elijah Anderson",
      email: "elijah.a@gmail.com",
      phone: "+1-415-555-0214",
      source: "form",
    },
    {
      name: "Harper Wilson",
      email: "harper.w@email.com",
      phone: "+1-415-555-0215",
      source: "search",
    },
    {
      name: "Lucas Moore",
      email: "lucas.m@gmail.com",
      phone: "+1-415-555-0216",
      source: "referral",
    },
    {
      name: "Evelyn Taylor",
      email: "evelyn.t@outlook.com",
      phone: "+1-415-555-0217",
      source: "form",
    },
    { name: "Henry Jackson", email: "henry.j@email.com", phone: "+1-415-555-0218", source: "form" },
    {
      name: "Abigail White",
      email: "abigail.w@gmail.com",
      phone: "+1-415-555-0219",
      source: "search",
    },
    {
      name: "Sebastian Harris",
      email: "sebastian.h@email.com",
      phone: "+1-415-555-0220",
      source: "referral",
    },
  ];

  const contacts = [];
  for (let i = 0; i < contactsData.length; i++) {
    const cd = contactsData[i];
    const contact = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        name: cd.name,
        email: cd.email,
        phone: cd.phone,
        source: cd.source,
        notes: i % 3 === 0 ? "VIP patient — handle with priority" : undefined,
      },
    });
    contacts.push(contact);

    // Create conversation with messages
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact.id,
        subject: `Conversation — ${contact.name}`,
        isActive: i < 15, // Last 5 have automation paused (staff replied)
        lastMessageAt: subHours(new Date(), i * 2),
        unreadCount: i % 4 === 0 ? 2 : 0,
      },
    });

    // Add 2–5 messages per conversation
    const msgCount = 2 + (i % 4);
    for (let m = 0; m < msgCount; m++) {
      const isInbound = m % 2 === 0;
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: isInbound ? "INBOUND" : "OUTBOUND",
          channel: m % 3 === 0 ? "SMS" : "EMAIL",
          content: isInbound
            ? `Hi, I'd like to inquire about your ${services[m % services.length].name} service. (msg ${m + 1})`
            : `Thank you for reaching out, ${contact.name.split(" ")[0]}! We'd be happy to help. (reply ${m + 1})`,
          isAutomated: !isInbound && m === 1,
          status: "DELIVERED",
          senderId: isInbound ? undefined : staffMembers[m % staffMembers.length].id,
          createdAt: subHours(new Date(), i * 2 + (msgCount - m)),
        },
      });
    }
  }
  console.log(`   ✓ 20 contacts + conversations + messages`);

  // ─────────────────────────────────────────────
  // 6. BOOKINGS — 12 bookings across statuses
  // ─────────────────────────────────────────────
  console.log("\n📅 Creating 12 Bookings...");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
  const setHM = (d: Date, h: number, m: number) => {
    const r = new Date(d);
    r.setHours(h, m, 0, 0);
    return r;
  };

  const bookingsData = [
    // Today — upcoming
    { ci: 0, si: 0, date: setHM(today, 9, 0), status: "CONFIRMED" },
    { ci: 1, si: 1, date: setHM(today, 10, 30), status: "CONFIRMED" },
    { ci: 2, si: 2, date: setHM(today, 14, 0), status: "PENDING" },
    { ci: 3, si: 3, date: setHM(today, 15, 30), status: "CONFIRMED" },
    // Tomorrow
    { ci: 4, si: 0, date: setHM(addDays(today, 1), 9, 30), status: "CONFIRMED" },
    { ci: 5, si: 4, date: setHM(addDays(today, 1), 11, 0), status: "PENDING" },
    { ci: 6, si: 1, date: setHM(addDays(today, 1), 14, 0), status: "CONFIRMED" },
    // Past — completed
    { ci: 7, si: 2, date: setHM(subDays(today, 1), 10, 0), status: "COMPLETED" },
    { ci: 8, si: 0, date: setHM(subDays(today, 1), 13, 0), status: "COMPLETED" },
    { ci: 9, si: 3, date: setHM(subDays(today, 2), 11, 30), status: "COMPLETED" },
    // Cancelled / No-show
    { ci: 10, si: 1, date: setHM(subDays(today, 2), 15, 0), status: "CANCELLED" },
    { ci: 11, si: 4, date: setHM(subDays(today, 3), 9, 0), status: "NO_SHOW" },
  ];

  const bookings = [];
  for (const b of bookingsData) {
    const svc = services[b.si];
    const booking = await prisma.booking.create({
      data: {
        workspaceId: workspace.id,
        contactId: contacts[b.ci].id,
        serviceId: svc.id,
        date: b.date,
        endTime: addMin(b.date, svc.duration),
        status: b.status,
        notes: `${b.status} — ${svc.name}`,
      },
    });
    bookings.push(booking);
    console.log(
      `   ✓ ${contacts[b.ci].name} → ${svc.name} @ ${b.date.toLocaleTimeString()} (${b.status})`
    );
  }

  // ─────────────────────────────────────────────
  // 7. INTAKE FORMS + CONTACT FORMS
  // ─────────────────────────────────────────────
  console.log("\n📄 Creating Forms...");

  const intakeForm1 = await prisma.intakeForm.create({
    data: {
      workspaceId: workspace.id,
      name: "General Health Intake",
      description: "Standard patient intake questionnaire",
      serviceId: services[0].id,
      isActive: true,
      fields: JSON.stringify([
        { id: "f1", label: "Date of Birth", type: "date", required: true },
        { id: "f2", label: "Primary Complaint", type: "text", required: true },
        { id: "f3", label: "Current Medications", type: "textarea", required: false },
        { id: "f4", label: "Allergies", type: "text", required: false },
        { id: "f5", label: "Emergency Contact", type: "text", required: true },
      ]),
    },
  });

  const intakeForm2 = await prisma.intakeForm.create({
    data: {
      workspaceId: workspace.id,
      name: "Therapy Consent Form",
      description: "Consent and terms for therapy sessions",
      serviceId: services[2].id,
      isActive: true,
      fields: JSON.stringify([
        { id: "f1", label: "Full Legal Name", type: "text", required: true },
        { id: "f2", label: "Consent Signature (type name)", type: "text", required: true },
        { id: "f3", label: "Insurance Provider", type: "text", required: false },
      ]),
    },
  });

  const contactForm = await prisma.contactForm.create({
    data: {
      workspaceId: workspace.id,
      name: "New Patient Inquiry",
      slug: `careops-clinic-${workspace.id.slice(0, 8)}`,
      welcomeMessage:
        "Welcome to CareOps Test Clinic! Fill out this form and we'll be in touch within 24 hours.",
      isActive: true,
      fields: JSON.stringify([
        { id: "f1", label: "Full Name", type: "text", required: true },
        { id: "f2", label: "Email Address", type: "email", required: true },
        { id: "f3", label: "Phone Number", type: "tel", required: false },
        { id: "f4", label: "Reason for Inquiry", type: "textarea", required: true },
      ]),
    },
  });

  // Form Submissions
  await prisma.formSubmission.create({
    data: {
      workspaceId: workspace.id,
      contactId: contacts[0].id,
      intakeFormId: intakeForm1.id,
      bookingId: bookings[0].id,
      status: "PENDING",
      sentAt: subDays(today, 1),
    },
  });
  await prisma.formSubmission.create({
    data: {
      workspaceId: workspace.id,
      contactId: contacts[1].id,
      intakeFormId: intakeForm1.id,
      bookingId: bookings[1].id,
      status: "SENT",
      sentAt: subDays(today, 1),
    },
  });
  await prisma.formSubmission.create({
    data: {
      workspaceId: workspace.id,
      contactId: contacts[7].id,
      intakeFormId: intakeForm2.id,
      bookingId: bookings[7].id,
      status: "COMPLETED",
      sentAt: subDays(today, 2),
      completedAt: subDays(today, 1),
    },
  });
  await prisma.formSubmission.create({
    data: {
      workspaceId: workspace.id,
      contactId: contacts[9].id,
      intakeFormId: intakeForm1.id,
      bookingId: bookings[9].id,
      status: "OVERDUE",
      sentAt: subDays(today, 4),
      dueDate: subDays(today, 2),
    },
  });
  console.log(`   ✓ 2 intake forms, 1 contact form, 4 submissions`);

  // ─────────────────────────────────────────────
  // 8. INVENTORY — 8 items
  // ─────────────────────────────────────────────
  console.log("\n📦 Creating 8 Inventory Items...");
  const inventoryData = [
    {
      name: "Disposable Gloves (Box)",
      qty: 3,
      threshold: 5,
      unit: "boxes",
      vendor: "MedSupply Co.",
      vendorEmail: "orders@medsupply.test",
    },
    {
      name: "Surgical Masks",
      qty: 8,
      threshold: 10,
      unit: "packs",
      vendor: "SafeGear Inc.",
      vendorEmail: "supply@safegear.test",
    },
    {
      name: "Blood Pressure Cuffs",
      qty: 6,
      threshold: 3,
      unit: "units",
      vendor: "ClinEquip Ltd.",
      vendorEmail: null,
    },
    {
      name: "Antibacterial Wipes",
      qty: 2,
      threshold: 5,
      unit: "cartons",
      vendor: "CleanMed",
      vendorEmail: "orders@cleanmed.test",
    },
    {
      name: "Exam Table Paper",
      qty: 12,
      threshold: 4,
      unit: "rolls",
      vendor: "MedSupply Co.",
      vendorEmail: "orders@medsupply.test",
    },
    {
      name: "Sterile Gauze Pads",
      qty: 4,
      threshold: 8,
      unit: "packs",
      vendor: "WoundCare Pro",
      vendorEmail: null,
    },
    {
      name: "Otoscope Earpieces",
      qty: 50,
      threshold: 20,
      unit: "pieces",
      vendor: "ClinEquip Ltd.",
      vendorEmail: null,
    },
    {
      name: "Hand Sanitizer (1L)",
      qty: 3,
      threshold: 6,
      unit: "bottles",
      vendor: "CleanMed",
      vendorEmail: "orders@cleanmed.test",
    },
  ];

  const inventoryItems = [];
  for (const inv of inventoryData) {
    const item = await prisma.inventoryItem.create({
      data: {
        workspaceId: workspace.id,
        name: inv.name,
        quantity: inv.qty,
        threshold: inv.threshold,
        unit: inv.unit,
        vendorName: inv.vendor,
        vendorEmail: inv.vendorEmail,
      },
    });
    inventoryItems.push(item);
    const lowStock = inv.qty < inv.threshold;
    console.log(
      `   ${lowStock ? "⚠️ " : "✓ "} ${inv.name} (${inv.qty}/${inv.threshold} ${inv.unit})${lowStock ? " — LOW STOCK" : ""}`
    );

    // Add inventory log for some items
    if (inv.qty < inv.threshold || Math.random() > 0.5) {
      await prisma.inventoryLog.create({
        data: {
          workspaceId: workspace.id,
          itemId: item.id,
          previousQty: inv.qty + 5,
          newQty: inv.qty,
          change: -5,
          reason: "usage",
          referenceType: "manual",
          createdAt: subDays(today, 1),
        },
      });
    }
  }

  // Link inventory to services
  await prisma.serviceInventoryLink.create({
    data: { serviceId: services[0].id, inventoryId: inventoryItems[0].id, quantity: 1 },
  });
  await prisma.serviceInventoryLink.create({
    data: { serviceId: services[0].id, inventoryId: inventoryItems[1].id, quantity: 1 },
  });
  await prisma.serviceInventoryLink.create({
    data: { serviceId: services[1].id, inventoryId: inventoryItems[4].id, quantity: 2 },
  });

  // ─────────────────────────────────────────────
  // 9. AUTOMATION RULES — all 6 PRD triggers
  // ─────────────────────────────────────────────
  console.log("\n🤖 Creating 6 Automation Rules...");
  const automationRules = [
    {
      name: "Welcome New Patient",
      trigger: "NEW_CONTACT",
      messageTemplate:
        "Welcome to CareOps Test Clinic, {{contact_name}}! We're happy to have you. Our team will reach out shortly to discuss your needs.",
      delayMinutes: 0,
      isActive: true,
    },
    {
      name: "Booking Confirmation",
      trigger: "BOOKING_CREATED",
      messageTemplate:
        "Hi {{contact_name}}, your {{service_name}} is confirmed for {{date}}. Please arrive 10 minutes early. Reply CANCEL to reschedule.",
      delayMinutes: 0,
      isActive: true,
    },
    {
      name: "Appointment Reminder (24h)",
      trigger: "BEFORE_BOOKING",
      messageTemplate:
        "Reminder: Hi {{contact_name}}, you have a {{service_name}} appointment tomorrow. We look forward to seeing you!",
      delayMinutes: 1440,
      isActive: true,
    },
    {
      name: "Intake Form Nudge",
      trigger: "FORM_PENDING",
      messageTemplate:
        "Hi {{contact_name}}, your intake form is still pending. Please complete it before your appointment: {{form_url}}",
      delayMinutes: 60,
      isActive: true,
    },
    {
      name: "Low Stock Alert",
      trigger: "INVENTORY_LOW",
      messageTemplate:
        "⚠️ {{item_name}} is running low ({{qty}} remaining, threshold: {{threshold}}). Please reorder from {{vendor_name}}.",
      delayMinutes: 0,
      isActive: true,
    },
    {
      name: "Staff Reply — Pause Automation",
      trigger: "STAFF_REPLY",
      messageTemplate: "",
      delayMinutes: 0,
      isActive: true,
    },
  ];

  const createdRules = [];
  for (const r of automationRules) {
    const rule = await prisma.automationRule.create({
      data: {
        workspaceId: workspace.id,
        name: r.name,
        trigger: r.trigger,
        messageTemplate: r.messageTemplate,
        delayMinutes: r.delayMinutes,
        isActive: r.isActive,
      },
    });
    createdRules.push(rule);
    console.log(`   ✓ ${rule.name} [${rule.trigger}]`);
  }

  // Add some automation logs for realism
  await prisma.automationLog.create({
    data: {
      ruleId: createdRules[0].id,
      trigger: "NEW_CONTACT",
      status: "SUCCESS",
      recipient: contacts[0].email!,
      details: "Welcome email sent",
    },
  });
  await prisma.automationLog.create({
    data: {
      ruleId: createdRules[1].id,
      trigger: "BOOKING_CREATED",
      status: "SUCCESS",
      recipient: contacts[1].email!,
      details: "Confirmation email sent",
    },
  });
  await prisma.automationLog.create({
    data: {
      ruleId: createdRules[1].id,
      trigger: "BOOKING_CREATED",
      status: "FAILED",
      recipient: "bad@email",
      details: "SMTP delivery failed: invalid address",
    },
  });

  // ─────────────────────────────────────────────
  // 10. ALERTS
  // ─────────────────────────────────────────────
  console.log("\n🔔 Creating Alerts...");
  const alertsData = [
    {
      type: "booking",
      title: "New Booking",
      message: `${contacts[0].name} booked General Consultation for today 9:00 AM`,
      actionUrl: "/bookings",
      isRead: false,
    },
    {
      type: "booking",
      title: "New Booking",
      message: `${contacts[4].name} booked Physical Therapy for tomorrow 9:30 AM`,
      actionUrl: "/bookings",
      isRead: false,
    },
    {
      type: "inventory",
      title: "Low Stock Alert",
      message: "Disposable Gloves (Box) is running low (3 boxes, threshold: 5)",
      actionUrl: "/inventory",
      isRead: false,
    },
    {
      type: "inventory",
      title: "Low Stock Alert",
      message: "Antibacterial Wipes running low (2 cartons, threshold: 5)",
      actionUrl: "/inventory",
      isRead: false,
    },
    {
      type: "inventory",
      title: "Low Stock Alert",
      message: "Sterile Gauze Pads running low (4 packs, threshold: 8)",
      actionUrl: "/inventory",
      isRead: false,
    },
    {
      type: "inventory",
      title: "Low Stock Alert",
      message: "Hand Sanitizer (1L) running low (3 bottles, threshold: 6)",
      actionUrl: "/inventory",
      isRead: false,
    },
    {
      type: "automation",
      title: "Automation Paused",
      message: `Staff replied to ${contacts[15].name} — automation paused for 24h`,
      actionUrl: "/inbox",
      isRead: true,
    },
    {
      type: "form",
      title: "Overdue Form",
      message: `${contacts[9].name} has an overdue intake form`,
      actionUrl: "/forms",
      isRead: false,
    },
  ];

  for (const a of alertsData) {
    await prisma.alert.create({
      data: {
        workspaceId: workspace.id,
        type: a.type,
        title: a.title,
        message: a.message,
        actionUrl: a.actionUrl,
        isRead: a.isRead,
        createdAt: subHours(new Date(), alertsData.indexOf(a) * 3),
      },
    });
  }
  console.log(`   ✓ 8 alerts (4 low-stock, 2 bookings, 1 automation, 1 form)`);

  // ─────────────────────────────────────────────
  // 11. AI PREFERENCES
  // ─────────────────────────────────────────────
  await prisma.aIPreferences.create({
    data: {
      workspaceId: workspace.id,
      smartReplyEnabled: true,
      insightsEnabled: true,
      voiceEnabled: false,
      anomalyDetectionEnabled: true,
      inventoryForecastEnabled: true,
      autoClassifyEnabled: true,
      defaultReplyTone: "professional",
      geminiModel: "gemini-2.0-flash",
    },
  });

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log("\n" + "═".repeat(55));
  console.log("✅ CareOps Deep Test Seed COMPLETE!\n");
  console.log("🔐 LOGIN CREDENTIALS");
  console.log("─".repeat(55));
  console.log(`OWNER  →  testowner@careops.test  /  Test@1234`);
  for (const s of staffMembers) {
    console.log(`STAFF  →  ${s.email}  /  Staff@1234`);
  }
  console.log("\n📊 DATA SEEDED");
  console.log("─".repeat(55));
  console.log(`  Workspace ID:  ${workspace.id}`);
  console.log(`  Contacts:      20`);
  console.log(`  Bookings:      12 (confirmed, pending, completed, cancelled, no-show)`);
  console.log(`  Inventory:     8 items (4 below threshold — low stock alerts)`);
  console.log(`  Staff:         5 members with varying permissions`);
  console.log(`  Auto Rules:    6 (all PRD triggers)`);
  console.log(`  Forms:         2 intake + 1 contact form + 4 submissions`);
  console.log(`  Alerts:        8 (4 low-stock, 2 bookings, 1 automation, 1 form)`);
  console.log(`  Conversations: 20 (15 active, 5 paused)`);
  console.log("\n🌐 PUBLIC URLS");
  console.log("─".repeat(55));
  console.log(`  Booking:      http://localhost:3000/book/${workspace.id}`);
  console.log(`  Contact Form: http://localhost:3000/contact/${contactForm.slug}`);
  console.log("═".repeat(55));
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
