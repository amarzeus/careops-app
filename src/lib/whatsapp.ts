/**
 * WhatsApp messaging module for CareOps.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * High-level WhatsApp helpers built on top of Twilio.
 * Provides business-specific templates for bookings, forms, reminders.
 */

import {
  sendWhatsApp as twilioSendWhatsApp,
  sendWhatsAppOTP as twilioSendWhatsAppOTP,
  isConfigured as isWhatsAppConfigured,
  type TwilioResult,
} from "./twilio";

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
): Promise<TwilioResult> {
  return twilioSendWhatsAppOTP(phone, otp);
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
): Promise<TwilioResult> {
  const body = `Hi ${customerName}, your booking for ${serviceName} on ${dateTime} with ${businessName} is confirmed!`;
  return twilioSendWhatsApp(phone, body);
}

/**
 * Send a booking reminder via WhatsApp.
 */
export async function sendBookingReminder(
  phone: string,
  customerName: string,
  serviceName: string,
  dateTime: string
): Promise<TwilioResult> {
  const body = `Reminder: Hi ${customerName}, you have an appointment for ${serviceName} on ${dateTime}.`;
  return twilioSendWhatsApp(phone, body);
}

/**
 * Send a form completion request via WhatsApp.
 */
export async function sendFormRequest(
  phone: string,
  customerName: string,
  formName: string,
  formUrl: string
): Promise<TwilioResult> {
  const body = `Hi ${customerName}, please complete the ${formName} here: ${formUrl}`;
  return twilioSendWhatsApp(phone, body);
}

/**
 * Send a welcome message via WhatsApp.
 */
export async function sendWelcomeMessage(
  phone: string,
  customerName: string,
  businessName: string
): Promise<TwilioResult> {
  const body = `Welcome to ${businessName}, ${customerName}! We're glad to have you here.`;
  return twilioSendWhatsApp(phone, body);
}

/**
 * Send a generic text message via WhatsApp (within 24hr session window).
 */
export async function sendTextMessage(
  phone: string,
  message: string
): Promise<TwilioResult> {
  return twilioSendWhatsApp(phone, message);
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
