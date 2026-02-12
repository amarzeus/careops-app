/**
 * WhatsApp messaging module for CareOps.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * High-level WhatsApp helpers built on top of MSG91.
 * Provides business-specific templates for bookings, forms, reminders.
 */

import {
  sendWhatsAppTemplate,
  sendWhatsAppMessage,
  sendWhatsAppOTP as msg91SendWhatsAppOTP,
  isWhatsAppConfigured,
  type MSG91WhatsAppResult,
  type MSG91OTPResult,
} from "./msg91";

// ──── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppSendOptions {
  to: string;
  templateName: string;
  parameters: Array<{ type: string; text: string }>;
}

export interface WhatsAppTextOptions {
  to: string;
  body: string;
}

// ──── OTP via WhatsApp ─────────────────────────────────────────────────────────

/**
 * Send OTP verification code via WhatsApp.
 *
 * @param phone - Phone number in E.164 format (e.g., +919876543210)
 * @param otp - The OTP code to send
 */
export async function sendOTPViaWhatsApp(
  phone: string,
  otp: string
): Promise<MSG91OTPResult> {
  return msg91SendWhatsAppOTP(phone, otp);
}

// ──── Business Template Messages ───────────────────────────────────────────────

/**
 * Send a booking confirmation via WhatsApp.
 */
export async function sendBookingConfirmation(
  phone: string,
  customerName: string,
  serviceName: string,
  dateTime: string,
  businessName: string
): Promise<MSG91WhatsAppResult> {
  return sendWhatsAppTemplate(phone, "booking_confirmation", [
    { type: "text", text: customerName },
    { type: "text", text: serviceName },
    { type: "text", text: dateTime },
    { type: "text", text: businessName },
  ]);
}

/**
 * Send a booking reminder via WhatsApp.
 */
export async function sendBookingReminder(
  phone: string,
  customerName: string,
  serviceName: string,
  dateTime: string
): Promise<MSG91WhatsAppResult> {
  return sendWhatsAppTemplate(phone, "booking_reminder", [
    { type: "text", text: customerName },
    { type: "text", text: serviceName },
    { type: "text", text: dateTime },
  ]);
}

/**
 * Send a form completion request via WhatsApp.
 */
export async function sendFormRequest(
  phone: string,
  customerName: string,
  formName: string,
  formUrl: string
): Promise<MSG91WhatsAppResult> {
  return sendWhatsAppTemplate(phone, "form_request", [
    { type: "text", text: customerName },
    { type: "text", text: formName },
    { type: "text", text: formUrl },
  ]);
}

/**
 * Send a welcome message via WhatsApp.
 */
export async function sendWelcomeMessage(
  phone: string,
  customerName: string,
  businessName: string
): Promise<MSG91WhatsAppResult> {
  return sendWhatsAppTemplate(phone, "welcome_message", [
    { type: "text", text: customerName },
    { type: "text", text: businessName },
  ]);
}

/**
 * Send a generic text message via WhatsApp (within 24hr window).
 */
export async function sendTextMessage(
  phone: string,
  message: string
): Promise<MSG91WhatsAppResult> {
  return sendWhatsAppMessage(phone, message);
}

// ──── Utilities ────────────────────────────────────────────────────────────────

/**
 * Check if WhatsApp channel is available.
 */
export function isAvailable(): boolean {
  return isWhatsAppConfigured();
}

/**
 * Build a WhatsApp OTP message for fallback/logging purposes.
 */
export function buildOTPMessage(otp: string): string {
  return `Your CareOps verification code is: *${otp}*\n\nThis code expires in 15 minutes. Do not share this code with anyone.`;
}
