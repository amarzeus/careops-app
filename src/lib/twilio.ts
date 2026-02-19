import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
const authToken = process.env.TWILIO_AUTH_TOKEN || "";
const fromNumber = process.env.TWILIO_PHONE_NUMBER || "";

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface TwilioResult {
    success: boolean;
    requestId?: string;
    error?: string;
    errorCode?: string;
    retryable?: boolean;
}

export type TwilioErrorCode =
    | "NOT_CONFIGURED"
    | "INVALID_NUMBER"
    | "AUTH_ERROR"
    | "RATE_LIMITED"
    | "NETWORK_ERROR"
    | "TWILIO_ERROR"
    | "UNKNOWN";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 *
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

 
/**
 *
 */
function categorizeError(error: any, statusCode?: number): { code: TwilioErrorCode; retryable: boolean } {
    const message = error?.message?.toLowerCase() || "";

    if (statusCode === 401 || statusCode === 403 || message.includes("auth")) {
        return { code: "AUTH_ERROR", retryable: false };
    }
    if (message.includes("invalid") && message.includes("number") || message.includes("not a valid")) {
        return { code: "INVALID_NUMBER", retryable: false };
    }
    if (message.includes("rate limit") || message.includes("too many requests")) {
        return { code: "RATE_LIMITED", retryable: true };
    }
    if (message.includes("network") || message.includes("timeout") || message.includes("econnrefused")) {
        return { code: "NETWORK_ERROR", retryable: true };
    }
    if (statusCode && statusCode >= 500) {
        return { code: "TWILIO_ERROR", retryable: true };
    }
    return { code: "UNKNOWN", retryable: false };
}


/**
 * Normalizes a phone number to E.164 format.
 * @param phone - The input phone number
 * @returns Normalized phone number string
 */
export function normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return phone.startsWith("+") ? `+${digits}` : `+${digits}`;
}

/**
 *
 */
function validatePhoneNumber(phone: string): { valid: boolean; formatted: string; error?: string } {
    if (!phone) {
        return { valid: false, formatted: "", error: "Phone number is required" };
    }

    // If it already starts with +, just clean any non-digits (except +)
    if (phone.startsWith("+")) {
        const cleaned = "+" + phone.replace(/\D/g, "");
        if (cleaned.length < 8) {
            return { valid: false, formatted: "", error: "Phone number too short" };
        }
        return { valid: true, formatted: cleaned };
    }

    const digits = phone.replace(/\D/g, "");

    if (digits.length < 10) {
        return { valid: false, formatted: "", error: "Phone number too short" };
    }

    // 10 digits -> Assume US/Canada if it doesn't start with 0
    if (digits.length === 10) {
        if (digits.startsWith("0")) {
            return { valid: false, formatted: "", error: "10-digit number cannot start with 0 (Did you miss the country code?)" };
        }
        return { valid: true, formatted: `+1${digits}` };
    }

    // 11 digits starting with 1 -> Assume US/Canada with country code
    if (digits.length === 11 && digits.startsWith("1")) {
        return { valid: true, formatted: `+${digits}` };
    }

    // 11 or more digits -> Assume it includes a country code
    if (digits.length >= 11) {
        // If it starts with 00, replace with +
        if (phone.startsWith("00")) {
            return { valid: true, formatted: `+${digits.substring(2)}` };
        }
        return { valid: true, formatted: `+${digits}` };
    }

    return { valid: true, formatted: `+${digits}` };
}

/**
 * Sends an SMS message using Twilio.
 * @param to - The recipient's phone number
 * @param body - The message content
 * @returns Result of the SMS operation
 */
export async function sendSMS(to: string, body: string): Promise<TwilioResult> {
    if (!client || !fromNumber) {
        console.warn("[Twilio:sendSMS] Twilio not configured");
        return { success: false, error: "Twilio not configured", errorCode: "NOT_CONFIGURED", retryable: false };
    }

    const validation = validatePhoneNumber(to);
    if (!validation.valid) {
        console.error(`[Twilio:sendSMS] Invalid phone number: ${to}`);
        return { success: false, error: validation.error, errorCode: "INVALID_NUMBER", retryable: false };
    }

    const formattedPhone = validation.formatted;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[Twilio:sendSMS] Attempt ${attempt}/${MAX_RETRIES} to ${formattedPhone}`);

            const message = await client.messages.create({
                body,
                from: fromNumber,
                to: formattedPhone,
            });

            console.log(`[Twilio:sendSMS] Sent to ${formattedPhone}, SID: ${message.sid}, Status: ${message.status}`);

            return {
                success: true,
                requestId: message.sid,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            lastError = error;
            const statusCode = error?.status || error?.response?.status;
            const { code, retryable } = categorizeError(error, statusCode);

            console.error(`[Twilio:sendSMS] Attempt ${attempt} failed: ${error.message} (code: ${code})`);

            if (!retryable || attempt >= MAX_RETRIES) {
                return {
                    success: false,
                    error: error.message,
                    errorCode: code,
                    retryable: false
                };
            }

            const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            console.log(`[Twilio:sendSMS] Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError || "Unknown error");
    const { code } = categorizeError(lastError);
    return {
        success: false,
        error: errorMessage || "Max retries exceeded",
        errorCode: code,
        retryable: false
    };
}

/**
 * Sends a WhatsApp message using Twilio.
 * @param to - The recipient's phone number
 * @param body - The message content
 * @returns Result of the WhatsApp operation
 */
export async function sendWhatsApp(to: string, body: string): Promise<TwilioResult> {
    if (!client || !fromNumber) {
        console.warn("[Twilio:sendWhatsApp] Twilio not configured");
        return { success: false, error: "Twilio not configured", errorCode: "NOT_CONFIGURED", retryable: false };
    }

    const validation = validatePhoneNumber(to);
    if (!validation.valid) {
        console.error(`[Twilio:sendWhatsApp] Invalid phone number: ${to}`);
        return { success: false, error: validation.error, errorCode: "INVALID_NUMBER", retryable: false };
    }

    const formattedPhone = validation.formatted;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[Twilio:sendWhatsApp] Attempt ${attempt}/${MAX_RETRIES} to ${formattedPhone}`);

            const whatsappTo = formattedPhone.startsWith('whatsapp:') ? formattedPhone : `whatsapp:${formattedPhone}`;
            const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

            const message = await client.messages.create({
                body,
                from: whatsappFrom,
                to: whatsappTo,
            });

            console.log(`[Twilio:sendWhatsApp] Sent to ${formattedPhone}, SID: ${message.sid}, Status: ${message.status}`);

            return {
                success: true,
                requestId: message.sid,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            lastError = error;
            const statusCode = error?.status || error?.response?.status;
            const { code, retryable } = categorizeError(error, statusCode);

            console.error(`[Twilio:sendWhatsApp] Attempt ${attempt} failed: ${error.message} (code: ${code})`);

            if (!retryable || attempt >= MAX_RETRIES) {
                return {
                    success: false,
                    error: error.message,
                    errorCode: code,
                    retryable: false
                };
            }

            const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            console.log(`[Twilio:sendWhatsApp] Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError || "Unknown error");
    const { code } = categorizeError(lastError);
    return {
        success: false,
        error: errorMessage || "Max retries exceeded",
        errorCode: code,
        retryable: false
    };
}

/**
 * Sends a One-Time Password via SMS.
 * @param phone - Recipient phone number
 * @param otp - The OTP code
 * @returns Result of the operation
 */
export async function sendOTP(phone: string, otp: string): Promise<TwilioResult> {
    const body = `Your CareOps verification code is: ${otp}. It expires in 15 minutes.`;
    return sendSMS(phone, body);
}

/**
 * Sends a One-Time Password via WhatsApp.
 * @param phone - Recipient phone number
 * @param otp - The OTP code
 * @returns Result of the operation
 */
export async function sendWhatsAppOTP(phone: string, otp: string): Promise<TwilioResult> {
    const body = `Your CareOps verification code is: *${otp}*\n\nThis code expires in 15 minutes.`;
    return sendWhatsApp(phone, body);
}

/**
 * Checks if Twilio service is fully configured.
 * @returns True if configured
 */
export function isConfigured(): boolean {
    return !!(accountSid && authToken && fromNumber);
}

/**
 * Checks the health and connection of the Twilio service.
 * @returns Object indicating health status and potential errors
 */
export async function checkTwilioHealth(): Promise<{ healthy: boolean; balance?: unknown; error?: string }> {
    if (!isConfigured()) {
        return { healthy: false, error: "Twilio not configured" };
    }

    try {
        const account = await client?.api.accounts(accountSid).fetch();
        return {
            healthy: !!account,
            balance: account?.status
        };
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        return {
            healthy: false,
            error: err.message
        };
    }
}
