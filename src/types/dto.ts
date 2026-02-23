export interface ConversationDTO {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  intent?: {
    type:
      | "inquiry"
      | "complaint"
      | "booking_request"
      | "urgent"
      | "general"
      | "follow_up"
      | "cancellation";
    priority: "high" | "medium" | "low";
    confidence: number;
    suggestedAction: string;
  } | null;
}

export interface MessageDTO {
  id: string;
  content: string;
  direction: "INBOUND" | "OUTBOUND";
  channel?: "EMAIL" | "SMS" | "WHATSAPP" | "SYSTEM";
  isAutomated: boolean;
  createdAt: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
}

export interface ContactFormDTO {
  id: string;
  name: string;
  fields: string;
  isActive: boolean;
  slug: string;
  welcomeMessage: string | null;
  createdAt: string;
}

export interface ServiceDTO {
  id: string;
  name: string;
}

export interface IntakeFormDTO {
  id: string;
  name: string;
  description: string | null;
  fields: string;
  isActive: boolean;
  slug: string;
  serviceId: string | null;
  service: ServiceDTO | null;
  createdAt: string;
  _count?: { submissions: number };
}

export interface ContactRefDTO {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface FormSubmissionDTO {
  id: string;
  data: Record<string, unknown>;
  status: "PENDING" | "SENT" | "COMPLETED" | "OVERDUE";
  intakeForm: { name: string } | null;
  contact: ContactRefDTO | null;
  createdAt: string;
}

export interface InventoryItemDTO {
  id: string;
  name: string;
  description: string;
  quantity: number;
  threshold: number;
  unit: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
}

export interface StaffMemberDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  canAccessInbox: boolean;
  canAccessBookings: boolean;
  canAccessForms: boolean;
  canAccessInventory: boolean;
  createdAt: string;
}

export interface AutomationRuleDTO {
  id: string;
  name: string;
  trigger: string;
  isActive: boolean;
  messageTemplate: string | null;
  delayMinutes: number;
  createdAt: string;
}

export interface WorkspaceSettingsDTO {
  id: string;
  name: string;
  address: string | null;
  timezone: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  emailConfigured: boolean;
  smsConfigured: boolean;
  whatsappConfigured: boolean;
  googleCalendarConnected: boolean;
  googleCalendarEmail: string | null;
}

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}
