/**
 * Vertical-specific templates for workspace onboarding.
 * Each template pre-populates services, inventory items, automation rules,
 * and contact form fields for a specific industry.
 */

export type VerticalKey =
  | "healthcare_clinic"
  | "dental_practice"
  | "salon_spa"
  | "auto_repair"
  | "pet_care";

export interface VerticalTemplate {
  key: VerticalKey;
  name: string;
  description: string;
  emoji: string;
  services: Array<{
    name: string;
    duration: number;
    price: number;
    description?: string;
  }>;
  inventoryItems: Array<{
    name: string;
    quantity: number;
    threshold: number;
    unit: string;
  }>;
  automationRules: Array<{
    name: string;
    trigger: string;
    messageTemplate: string;
    delayMinutes: number;
  }>;
  contactFormFields: Array<{
    label: string;
    type: string;
    required: boolean;
  }>;
}

export const VERTICAL_TEMPLATES: Record<VerticalKey, VerticalTemplate> = {
  healthcare_clinic: {
    key: "healthcare_clinic",
    name: "Healthcare Clinic",
    description: "General practice, specialist clinics, and urgent care",
    emoji: "🏥",
    services: [
      {
        name: "General Consultation",
        duration: 30,
        price: 150,
        description: "Routine check-up and consultation",
      },
      {
        name: "Follow-up Visit",
        duration: 15,
        price: 75,
        description: "Follow-up on previous consultation",
      },
      {
        name: "Annual Physical",
        duration: 60,
        price: 250,
        description: "Comprehensive annual physical exam",
      },
      {
        name: "Lab Work / Blood Draw",
        duration: 15,
        price: 50,
        description: "Blood sample collection",
      },
      { name: "Vaccination", duration: 15, price: 40, description: "Vaccine administration" },
      {
        name: "Minor Procedure",
        duration: 45,
        price: 200,
        description: "Minor in-office procedure",
      },
    ],
    inventoryItems: [
      { name: "Surgical Gloves (Box)", quantity: 50, threshold: 10, unit: "boxes" },
      { name: "Face Masks (Box)", quantity: 30, threshold: 5, unit: "boxes" },
      { name: "Syringes (Pack)", quantity: 100, threshold: 20, unit: "packs" },
      { name: "Bandages (Roll)", quantity: 60, threshold: 15, unit: "rolls" },
      { name: "Antiseptic Wipes", quantity: 80, threshold: 20, unit: "packs" },
      { name: "Tongue Depressors", quantity: 200, threshold: 50, unit: "pieces" },
    ],
    automationRules: [
      {
        name: "Appointment Reminder",
        trigger: "BOOKING_REMINDER_24H",
        messageTemplate:
          "Hi {{contact_name}}, your appointment at {{business_name}} is tomorrow at {{booking_time}}. Reply CONFIRM or call us to reschedule.",
        delayMinutes: 0,
      },
      {
        name: "Post-Visit Follow-up",
        trigger: "BOOKING_COMPLETED",
        messageTemplate:
          "Thank you for visiting {{business_name}}, {{contact_name}}. If you have any questions about your visit, don't hesitate to reach out.",
        delayMinutes: 1440,
      },
      {
        name: "New Patient Welcome",
        trigger: "NEW_CONTACT",
        messageTemplate:
          "Welcome to {{business_name}}, {{contact_name}}! We look forward to providing you with excellent care. Please complete your intake forms before your first visit.",
        delayMinutes: 0,
      },
    ],
    contactFormFields: [
      { label: "Full Name", type: "text", required: true },
      { label: "Email", type: "email", required: true },
      { label: "Phone", type: "phone", required: true },
      { label: "Date of Birth", type: "date", required: true },
      { label: "Insurance Provider", type: "text", required: false },
      { label: "Reason for Visit", type: "textarea", required: true },
    ],
  },

  dental_practice: {
    key: "dental_practice",
    name: "Dental Practice",
    description: "General dentistry, orthodontics, and oral surgery",
    emoji: "🦷",
    services: [
      {
        name: "Dental Cleaning",
        duration: 45,
        price: 120,
        description: "Professional teeth cleaning",
      },
      {
        name: "Dental Exam",
        duration: 30,
        price: 80,
        description: "Comprehensive dental examination",
      },
      { name: "X-Rays", duration: 15, price: 60, description: "Digital dental X-rays" },
      { name: "Filling", duration: 45, price: 200, description: "Tooth cavity filling" },
      { name: "Crown Fitting", duration: 60, price: 800, description: "Dental crown installation" },
      {
        name: "Teeth Whitening",
        duration: 60,
        price: 350,
        description: "Professional whitening treatment",
      },
      { name: "Root Canal", duration: 90, price: 1000, description: "Root canal treatment" },
    ],
    inventoryItems: [
      { name: "Dental Gloves (Box)", quantity: 40, threshold: 8, unit: "boxes" },
      { name: "Composite Filling Material", quantity: 20, threshold: 5, unit: "syringes" },
      { name: "Dental Mirrors", quantity: 30, threshold: 10, unit: "pieces" },
      { name: "Fluoride Trays", quantity: 100, threshold: 25, unit: "pieces" },
      { name: "Sterilization Pouches", quantity: 200, threshold: 50, unit: "pieces" },
      { name: "Whitening Gel Kit", quantity: 15, threshold: 5, unit: "kits" },
    ],
    automationRules: [
      {
        name: "Appointment Reminder",
        trigger: "BOOKING_REMINDER_24H",
        messageTemplate:
          "Hi {{contact_name}}, your dental appointment is tomorrow at {{booking_time}}. Please arrive 10 minutes early.",
        delayMinutes: 0,
      },
      {
        name: "6-Month Recall",
        trigger: "BOOKING_COMPLETED",
        messageTemplate:
          "Hi {{contact_name}}, it's been 6 months since your last cleaning at {{business_name}}. Time to schedule your next visit!",
        delayMinutes: 259200,
      },
      {
        name: "Post-Procedure Care",
        trigger: "BOOKING_COMPLETED",
        messageTemplate:
          "Hi {{contact_name}}, we hope you're feeling well after your procedure. Remember to follow your aftercare instructions. Contact us if you have any concerns.",
        delayMinutes: 120,
      },
    ],
    contactFormFields: [
      { label: "Full Name", type: "text", required: true },
      { label: "Email", type: "email", required: true },
      { label: "Phone", type: "phone", required: true },
      { label: "Date of Birth", type: "date", required: true },
      { label: "Dental Insurance", type: "text", required: false },
      { label: "Last Dental Visit", type: "date", required: false },
      { label: "Dental Concerns", type: "textarea", required: false },
    ],
  },

  salon_spa: {
    key: "salon_spa",
    name: "Salon & Spa",
    description: "Hair salons, beauty spas, nail bars, and wellness centers",
    emoji: "💇",
    services: [
      { name: "Haircut", duration: 45, price: 50, description: "Professional haircut and styling" },
      {
        name: "Hair Coloring",
        duration: 120,
        price: 120,
        description: "Full hair color treatment",
      },
      { name: "Blowout", duration: 30, price: 35, description: "Wash and blowout styling" },
      { name: "Manicure", duration: 30, price: 30, description: "Classic manicure" },
      { name: "Pedicure", duration: 45, price: 45, description: "Relaxing pedicure treatment" },
      { name: "Facial", duration: 60, price: 80, description: "Deep cleansing facial" },
      { name: "Full Body Massage", duration: 60, price: 90, description: "Relaxation massage" },
      { name: "Waxing", duration: 30, price: 40, description: "Body waxing service" },
    ],
    inventoryItems: [
      { name: "Shampoo (Liter)", quantity: 20, threshold: 5, unit: "bottles" },
      { name: "Conditioner (Liter)", quantity: 20, threshold: 5, unit: "bottles" },
      { name: "Hair Color Tubes", quantity: 40, threshold: 10, unit: "tubes" },
      { name: "Nail Polish (Set)", quantity: 30, threshold: 8, unit: "sets" },
      { name: "Massage Oil (Liter)", quantity: 10, threshold: 3, unit: "bottles" },
      { name: "Wax Strips (Pack)", quantity: 25, threshold: 8, unit: "packs" },
      { name: "Towels", quantity: 50, threshold: 15, unit: "pieces" },
    ],
    automationRules: [
      {
        name: "Appointment Reminder",
        trigger: "BOOKING_REMINDER_24H",
        messageTemplate:
          "Hi {{contact_name}}! Your appointment at {{business_name}} is tomorrow at {{booking_time}}. We can't wait to see you! ✨",
        delayMinutes: 0,
      },
      {
        name: "Thank You & Rebook",
        trigger: "BOOKING_COMPLETED",
        messageTemplate:
          "Thank you for visiting {{business_name}}, {{contact_name}}! We hope you love your new look. Book your next visit to keep it fresh! 💇‍♀️",
        delayMinutes: 60,
      },
      {
        name: "Birthday Offer",
        trigger: "NEW_CONTACT",
        messageTemplate:
          "Welcome to {{business_name}}, {{contact_name}}! As a new client, enjoy 15% off your first service. Use code WELCOME15 when booking.",
        delayMinutes: 0,
      },
    ],
    contactFormFields: [
      { label: "Full Name", type: "text", required: true },
      { label: "Email", type: "email", required: true },
      { label: "Phone", type: "phone", required: true },
      { label: "Preferred Stylist", type: "text", required: false },
      { label: "Service Interest", type: "text", required: false },
      { label: "Allergies/Sensitivities", type: "textarea", required: false },
    ],
  },

  auto_repair: {
    key: "auto_repair",
    name: "Auto Repair",
    description: "Auto shops, mechanics, tire centers, and body shops",
    emoji: "🔧",
    services: [
      {
        name: "Oil Change",
        duration: 30,
        price: 50,
        description: "Standard oil and filter change",
      },
      {
        name: "Brake Inspection",
        duration: 45,
        price: 40,
        description: "Full brake system inspection",
      },
      {
        name: "Tire Rotation",
        duration: 30,
        price: 30,
        description: "Four-tire rotation and balance",
      },
      {
        name: "Engine Diagnostic",
        duration: 60,
        price: 100,
        description: "OBD-II diagnostic scan and report",
      },
      {
        name: "AC Service",
        duration: 60,
        price: 120,
        description: "Air conditioning recharge and inspection",
      },
      {
        name: "Full Service",
        duration: 180,
        price: 300,
        description: "Comprehensive vehicle service",
      },
    ],
    inventoryItems: [
      { name: "Motor Oil (5W-30, Quart)", quantity: 60, threshold: 15, unit: "quarts" },
      { name: "Oil Filters", quantity: 40, threshold: 10, unit: "pieces" },
      { name: "Brake Pads (Set)", quantity: 20, threshold: 5, unit: "sets" },
      { name: "Air Filters", quantity: 25, threshold: 8, unit: "pieces" },
      { name: "Spark Plugs", quantity: 50, threshold: 15, unit: "pieces" },
      { name: "Coolant (Gallon)", quantity: 15, threshold: 5, unit: "gallons" },
      { name: "Wiper Blades", quantity: 30, threshold: 10, unit: "pairs" },
    ],
    automationRules: [
      {
        name: "Appointment Reminder",
        trigger: "BOOKING_REMINDER_24H",
        messageTemplate:
          "Hi {{contact_name}}, your vehicle service at {{business_name}} is scheduled for tomorrow at {{booking_time}}. Please bring your keys and any concerns.",
        delayMinutes: 0,
      },
      {
        name: "Service Complete",
        trigger: "BOOKING_COMPLETED",
        messageTemplate:
          "Hi {{contact_name}}, your vehicle service is complete! Please come by {{business_name}} to pick up your vehicle. Invoice details have been emailed.",
        delayMinutes: 0,
      },
      {
        name: "Maintenance Reminder",
        trigger: "BOOKING_COMPLETED",
        messageTemplate:
          "Hi {{contact_name}}, it's been 3 months since your last service at {{business_name}}. Time for a check-up? Book online or call us!",
        delayMinutes: 129600,
      },
    ],
    contactFormFields: [
      { label: "Full Name", type: "text", required: true },
      { label: "Email", type: "email", required: true },
      { label: "Phone", type: "phone", required: true },
      { label: "Vehicle Make/Model", type: "text", required: true },
      { label: "Vehicle Year", type: "text", required: false },
      { label: "License Plate", type: "text", required: false },
      { label: "Issue Description", type: "textarea", required: true },
    ],
  },

  pet_care: {
    key: "pet_care",
    name: "Pet Care",
    description: "Veterinary clinics, pet grooming, and boarding facilities",
    emoji: "🐾",
    services: [
      {
        name: "Wellness Exam",
        duration: 30,
        price: 60,
        description: "Annual pet wellness check-up",
      },
      { name: "Vaccination", duration: 15, price: 35, description: "Standard pet vaccination" },
      {
        name: "Grooming — Bath & Trim",
        duration: 60,
        price: 50,
        description: "Full bath, trim, and nail clip",
      },
      {
        name: "Dental Cleaning",
        duration: 45,
        price: 200,
        description: "Professional pet dental cleaning",
      },
      { name: "Microchipping", duration: 15, price: 45, description: "Pet microchip implantation" },
      { name: "Day Boarding", duration: 480, price: 35, description: "Full-day pet boarding" },
    ],
    inventoryItems: [
      { name: "Examination Gloves (Box)", quantity: 30, threshold: 8, unit: "boxes" },
      { name: "Pet Shampoo (Liter)", quantity: 15, threshold: 4, unit: "bottles" },
      { name: "Flea Treatment Doses", quantity: 40, threshold: 10, unit: "doses" },
      { name: "Heartworm Test Kits", quantity: 25, threshold: 8, unit: "kits" },
      { name: "Microchips", quantity: 20, threshold: 5, unit: "pieces" },
      { name: "Pet Treats (Bag)", quantity: 30, threshold: 10, unit: "bags" },
    ],
    automationRules: [
      {
        name: "Appointment Reminder",
        trigger: "BOOKING_REMINDER_24H",
        messageTemplate:
          "Hi {{contact_name}}, your pet's appointment at {{business_name}} is tomorrow at {{booking_time}}. Please bring any vaccination records. 🐾",
        delayMinutes: 0,
      },
      {
        name: "Post-Visit Follow-up",
        trigger: "BOOKING_COMPLETED",
        messageTemplate:
          "Thank you for bringing your furry friend to {{business_name}}! If you notice anything concerning, don't hesitate to call us. 🐶",
        delayMinutes: 1440,
      },
      {
        name: "Annual Reminder",
        trigger: "BOOKING_COMPLETED",
        messageTemplate:
          "Hi {{contact_name}}, it's time for your pet's annual wellness check at {{business_name}}. Book early to get your preferred time slot! 🐾",
        delayMinutes: 525600,
      },
    ],
    contactFormFields: [
      { label: "Owner Name", type: "text", required: true },
      { label: "Email", type: "email", required: true },
      { label: "Phone", type: "phone", required: true },
      { label: "Pet Name", type: "text", required: true },
      { label: "Pet Type (Dog, Cat, etc.)", type: "text", required: true },
      { label: "Pet Breed", type: "text", required: false },
      { label: "Pet Age", type: "text", required: false },
      { label: "Reason for Visit", type: "textarea", required: false },
    ],
  },
};

/** Returns the list of available templates for the selection screen */
export function getTemplateList() {
  return Object.values(VERTICAL_TEMPLATES).map((t) => ({
    key: t.key,
    name: t.name,
    description: t.description,
    emoji: t.emoji,
    serviceCount: t.services.length,
    inventoryCount: t.inventoryItems.length,
  }));
}
