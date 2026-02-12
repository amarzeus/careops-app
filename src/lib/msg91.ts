/**
 * MSG91 SMS & WhatsApp Integration for CareOps
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Comprehensive integration with MSG91's OTP, SMS, and WhatsApp APIs.
 *
 * API Reference:
 *   OTP:      https://docs.msg91.com/otp/sendotp
 *   SMS:      https://docs.msg91.com/sms/send-sms
 *   WhatsApp: https://docs.msg91.com/whatsapp/template-bulk
 *
 * Environment Variables Required:
 *   MSG91_AUTH_KEY       - API authentication key from MSG91 dashboard
 *   MSG91_TEMPLATE_ID   - Default SMS template ID
 *   MSG91_OTP_TEMPLATE_ID - OTP-specific template (optional, falls back to MSG91_TEMPLATE_ID)
 *   MSG91_WHATSAPP_INTEGRATED_NUMBER - Your registered WhatsApp number
 *   MSG91_WHATSAPP_OTP_TEMPLATE_NAME - WhatsApp OTP template name
 */

// ──── Types ────────────────────────────────────────────────────────────────────

export type OTPChannel = "sms" | "whatsapp" | "email";

export interface MSG91Response {
  type: "success" | "error";
  message: string;
  request_id?: string;
}

export interface MSG91OTPResult {
  success: boolean;
  requestId?: string;
  channel: OTPChannel;
  error?: string;
  details?: Record<string, unknown>;
}

export interface MSG91VerifyResult {
  success: boolean;
  error?: string;
  type?: string;
  message?: string;
}

export interface MSG91SMSResult {
  success: boolean;
  requestId?: string;
  error?: string;
}

export interface MSG91WhatsAppResult {
  success: boolean;
  requestId?: string;
  error?: string;
  data?: Record<string, unknown>;
}

export interface MSG91HealthResult {
  sms: { configured: boolean; healthy: boolean; balance?: unknown };
  whatsapp: { configured: boolean; healthy: boolean; balance?: unknown };
  otp: { configured: boolean };
}

// ──── Configuration ────────────────────────────────────────────────────────────

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || "";
const MSG91_OTP_TEMPLATE_ID =
  process.env.MSG91_OTP_TEMPLATE_ID || MSG91_TEMPLATE_ID;
const MSG91_WHATSAPP_NUMBER =
  process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER || "";
const MSG91_WHATSAPP_OTP_TEMPLATE =
  process.env.MSG91_WHATSAPP_OTP_TEMPLATE_NAME || "";

const MSG91_BASE_URL = "https://control.msg91.com/api/v5";
const MSG91_WHATSAPP_URL =
  "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

// ──── Helpers ──────────────────────────────────────────────────────────────────

function isConfigured(): boolean {
  return !!MSG91_AUTH_KEY;
}

function isWhatsAppConfigured(): boolean {
  return !!MSG91_AUTH_KEY && !!MSG91_WHATSAPP_NUMBER;
}

/** Normalize phone to digits only (remove leading '+') */
function formatPhone(phone: string): string {
  return phone.startsWith("+") ? phone.replace("+", "") : phone;
}

/** Log with a structured prefix */
function log(level: "info" | "warn" | "error", action: string, data?: Record<string, unknown>): void {
  const prefix = `[MSG91:${action}]`;
  const msg = data ? `${prefix} ${JSON.stringify(data)}` : prefix;
  if (level === "error") console.error(msg);
  else if (level === "warn") console.warn(msg);
  else console.log(msg);
}

/** Sleep helper for retry delays */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry-able fetch wrapper with exponential backoff */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000), // 15s timeout
      });
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      log("warn", "fetch-retry", {
        attempt: attempt + 1,
        maxRetries: retries,
        url: url.split("?")[0], // Don't log query params
        error: lastError.message,
      });
      if (attempt < retries) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

/** Standard headers for MSG91 API calls */
function getHeaders(): HeadersInit {
  return {
    authkey: MSG91_AUTH_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ──── OTP Functions ────────────────────────────────────────────────────────────

/**
 * Send OTP via SMS using MSG91's managed OTP service.
 *
 * MSG91 generates and manages the OTP internally - we don't need to
 * generate or store it ourselves. Verification is also done via MSG91.
 *
 * @param phone - Phone number in E.164 format (e.g., +919876543210)
 * @param otp - Optional: provide our own OTP (MSG91 will use this instead of auto-generating)
 * @param otpLength - OTP length (4 or 6, default 6)
 * @param otpExpiry - Expiry in minutes (default 15)
 */
export async function sendOTP(
  phone: string,
  otp?: string,
  otpLength: number = 6,
  otpExpiry: number = 15
): Promise<MSG91OTPResult> {
  if (!isConfigured()) {
    log("warn", "sendOTP", { reason: "MSG91_AUTH_KEY not configured" });
    return { success: false, channel: "sms", error: "MSG91 not configured" };
  }

  try {
    const formattedPhone = formatPhone(phone);

    // Build query params
    const params = new URLSearchParams({
      template_id: MSG91_OTP_TEMPLATE_ID,
      mobile: formattedPhone,
      otp_length: otpLength.toString(),
      otp_expiry: otpExpiry.toString(),
    });

    // If we provide our own OTP, include it
    if (otp) {
      params.set("otp", otp);
    }

    const res = await fetchWithRetry(
      `${MSG91_BASE_URL}/otp?${params.toString()}`,
      { method: "POST", headers: getHeaders() }
    );

    const data: MSG91Response = await res.json();

    if (data.type === "success") {
      log("info", "sendOTP", { phone: formattedPhone, requestId: data.request_id });
      return {
        success: true,
        requestId: data.request_id,
        channel: "sms",
      };
    }

    log("error", "sendOTP", { phone: formattedPhone, response: data });
    return {
      success: false,
      channel: "sms",
      error: data.message || "Failed to send OTP",
      details: data as unknown as Record<string, unknown>,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("error", "sendOTP-exception", { error: msg });
    return { success: false, channel: "sms", error: msg };
  }
}

/**
 * Send OTP via WhatsApp using MSG91's WhatsApp template API.
 *
 * This uses the WhatsApp outbound template API to deliver the OTP
 * through WhatsApp instead of SMS - higher delivery rate, better UX.
 *
 * @param phone - Phone number in E.164 format
 * @param otp - The OTP code to send
 * @param templateName - WhatsApp template name (default from env)
 */
export async function sendWhatsAppOTP(
  phone: string,
  otp: string,
  templateName?: string
): Promise<MSG91OTPResult> {
  if (!isWhatsAppConfigured()) {
    log("warn", "sendWhatsAppOTP", {
      reason: "WhatsApp not configured",
      hasAuthKey: !!MSG91_AUTH_KEY,
      hasNumber: !!MSG91_WHATSAPP_NUMBER,
    });
    return { success: false, channel: "whatsapp", error: "WhatsApp not configured. Set MSG91_WHATSAPP_INTEGRATED_NUMBER." };
  }

  const template = templateName || MSG91_WHATSAPP_OTP_TEMPLATE;

  try {
    const formattedPhone = formatPhone(phone);

    // MSG91 WhatsApp Template API payload
    const payload = {
      integrated_number: MSG91_WHATSAPP_NUMBER,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: template || "otp_verification",
          language: {
            code: "en",
            policy: "deterministic",
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: otp,
                },
              ],
            },
            // OTP button component (if template uses copy-code button)
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                {
                  type: "text",
                  text: otp,
                },
              ],
            },
          ],
        },
        to: formattedPhone,
      },
    };

    const res = await fetchWithRetry(MSG91_WHATSAPP_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && (data.type === "success" || data.message === "success" || res.status === 200)) {
      log("info", "sendWhatsAppOTP", {
        phone: formattedPhone,
        template: template,
      });
      return {
        success: true,
        requestId: data.request_id || data.id,
        channel: "whatsapp",
      };
    }

    log("error", "sendWhatsAppOTP", { phone: formattedPhone, response: data });
    return {
      success: false,
      channel: "whatsapp",
      error: data.message || "Failed to send WhatsApp OTP",
      details: data,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("error", "sendWhatsAppOTP-exception", { error: msg });
    return { success: false, channel: "whatsapp", error: msg };
  }
}

/**
 * Verify OTP via MSG91's verification API.
 *
 * Works for SMS OTPs that were sent via MSG91's sendOTP.
 * Falls back gracefully if MSG91 is not configured (local DB check).
 */
export async function verifyOTP(
  phone: string,
  otp: string
): Promise<MSG91VerifyResult> {
  if (!isConfigured()) {
    return { success: false, error: "MSG91 not configured" };
  }

  try {
    const formattedPhone = formatPhone(phone);

    const params = new URLSearchParams({
      mobile: formattedPhone,
      otp: otp,
    });

    const res = await fetchWithRetry(
      `${MSG91_BASE_URL}/otp/verify?${params.toString()}`,
      { method: "GET", headers: getHeaders() }
    );

    const data: MSG91Response = await res.json();

    if (data.type === "success") {
      log("info", "verifyOTP", { phone: formattedPhone, verified: true });
      return {
        success: true,
        type: data.type,
        message: data.message,
      };
    }

    log("warn", "verifyOTP", {
      phone: formattedPhone,
      verified: false,
      msg: data.message,
    });
    return {
      success: false,
      error: data.message || "Invalid OTP",
      type: data.type,
      message: data.message,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("error", "verifyOTP-exception", { error: msg });
    return { success: false, error: msg };
  }
}

/**
 * Resend OTP via MSG91's retry API.
 *
 * Supports multiple retry types:
 * - "text" (SMS)
 * - "voice" (phone call)
 *
 * @param phone - Phone number in E.164 format
 * @param retryType - "text" for SMS, "voice" for phone call
 */
export async function resendOTP(
  phone: string,
  retryType: "text" | "voice" = "text"
): Promise<MSG91OTPResult> {
  if (!isConfigured()) {
    return { success: false, channel: "sms", error: "MSG91 not configured" };
  }

  try {
    const formattedPhone = formatPhone(phone);

    const params = new URLSearchParams({
      mobile: formattedPhone,
      retrytype: retryType,
    });

    const res = await fetchWithRetry(
      `${MSG91_BASE_URL}/otp/retry?${params.toString()}`,
      { method: "GET", headers: getHeaders() }
    );

    const data: MSG91Response = await res.json();

    if (data.type === "success") {
      log("info", "resendOTP", { phone: formattedPhone, retryType });
      return {
        success: true,
        requestId: data.request_id,
        channel: "sms",
      };
    }

    return {
      success: false,
      channel: "sms",
      error: data.message || "Failed to resend OTP",
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("error", "resendOTP-exception", { error: msg });
    return { success: false, channel: "sms", error: msg };
  }
}

// ──── Transactional SMS ────────────────────────────────────────────────────────

/**
 * Send transactional SMS via MSG91 Flow API.
 *
 * @param phone - Phone number in E.164 format
 * @param message - SMS content
 * @param templateId - Optional template ID (uses default if not provided)
 */
export async function sendSMS(
  phone: string,
  message: string,
  templateId?: string
): Promise<MSG91SMSResult> {
  if (!isConfigured()) {
    log("warn", "sendSMS", { reason: "MSG91_AUTH_KEY not configured" });
    return { success: false, error: "MSG91 not configured" };
  }

  try {
    const formattedPhone = formatPhone(phone);

    const payload = {
      template_id: templateId || MSG91_TEMPLATE_ID,
      short_url: "0",
      recipients: [
        {
          mobiles: formattedPhone,
          message: message,
        },
      ],
    };

    const res = await fetchWithRetry(`${MSG91_BASE_URL}/flow/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.type === "success") {
      log("info", "sendSMS", { phone: formattedPhone });
      return { success: true, requestId: data.request_id };
    }

    log("error", "sendSMS", { phone: formattedPhone, response: data });
    return {
      success: false,
      error: data.message || "Failed to send SMS",
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("error", "sendSMS-exception", { error: msg });
    return { success: false, error: msg };
  }
}

// ──── WhatsApp Template Messaging ──────────────────────────────────────────────

/**
 * Send a WhatsApp template message via MSG91.
 *
 * @param phone - Phone number in E.164 format
 * @param templateName - Approved WhatsApp template name
 * @param parameters - Template body parameters
 * @param integratedNumber - Override the default integrated number
 */
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  parameters: Array<{ type: string; text: string }>,
  integratedNumber?: string
): Promise<MSG91WhatsAppResult> {
  if (!isWhatsAppConfigured() && !integratedNumber) {
    return { success: false, error: "WhatsApp not configured" };
  }

  try {
    const formattedPhone = formatPhone(phone);

    const payload = {
      integrated_number: integratedNumber || MSG91_WHATSAPP_NUMBER,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "en",
            policy: "deterministic",
          },
          components: [
            {
              type: "body",
              parameters: parameters,
            },
          ],
        },
        to: formattedPhone,
      },
    };

    const res = await fetchWithRetry(MSG91_WHATSAPP_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      log("info", "sendWhatsAppTemplate", {
        phone: formattedPhone,
        template: templateName,
      });
      return {
        success: true,
        requestId: data.request_id || data.id,
        data: data,
      };
    }

    log("error", "sendWhatsAppTemplate", { response: data });
    return {
      success: false,
      error: data.message || "Failed to send WhatsApp message",
      data: data,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("error", "sendWhatsAppTemplate-exception", { error: msg });
    return { success: false, error: msg };
  }
}

/**
 * Send a free-form WhatsApp text message (within 24hr session window).
 *
 * @param phone - Phone number in E.164 format
 * @param message - Text message content
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<MSG91WhatsAppResult> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: "WhatsApp not configured" };
  }

  try {
    const formattedPhone = formatPhone(phone);

    const payload = {
      integrated_number: MSG91_WHATSAPP_NUMBER,
      content_type: "text",
      payload: {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: message,
        },
      },
    };

    const sendMsgUrl = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/";

    const res = await fetchWithRetry(sendMsgUrl, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      log("info", "sendWhatsAppMessage", { phone: formattedPhone });
      return { success: true, requestId: data.request_id || data.id, data };
    }

    return {
      success: false,
      error: data.message || "Failed to send WhatsApp message",
      data,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("error", "sendWhatsAppMessage-exception", { error: msg });
    return { success: false, error: msg };
  }
}

// ──── Health Check & Balance ───────────────────────────────────────────────────

/**
 * Check MSG91 service health and configuration status.
 * Tests both SMS and WhatsApp API connectivity.
 */
export async function checkHealth(): Promise<MSG91HealthResult> {
  const result: MSG91HealthResult = {
    sms: { configured: isConfigured(), healthy: false },
    whatsapp: { configured: isWhatsAppConfigured(), healthy: false },
    otp: { configured: isConfigured() && !!MSG91_OTP_TEMPLATE_ID },
  };

  if (!isConfigured()) return result;

  // Check SMS balance
  try {
    const smsRes = await fetch(
      `${MSG91_BASE_URL}/balance?type=1`,
      { headers: { authkey: MSG91_AUTH_KEY }, signal: AbortSignal.timeout(10000) }
    );
    if (smsRes.ok) {
      result.sms.healthy = true;
      result.sms.balance = await smsRes.json();
    }
  } catch (e) {
    log("warn", "health-sms", { error: e instanceof Error ? e.message : "failed" });
  }

  // Check WhatsApp balance
  if (isWhatsAppConfigured()) {
    try {
      const waRes = await fetch(
        `${MSG91_BASE_URL}/whatsapp/checkBalance?integrated_number=${MSG91_WHATSAPP_NUMBER}`,
        { headers: { authkey: MSG91_AUTH_KEY }, signal: AbortSignal.timeout(10000) }
      );
      if (waRes.ok) {
        result.whatsapp.healthy = true;
        result.whatsapp.balance = await waRes.json();
      }
    } catch (e) {
      log("warn", "health-whatsapp", { error: e instanceof Error ? e.message : "failed" });
    }
  }

  return result;
}

/**
 * Quick check if MSG91 API key is valid.
 */
export async function validateApiKey(): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(`${MSG91_BASE_URL}/balance?type=1`, {
      headers: { authkey: MSG91_AUTH_KEY },
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ──── Utility Exports ──────────────────────────────────────────────────────────

export { isConfigured as isMSG91Configured, isWhatsAppConfigured };
