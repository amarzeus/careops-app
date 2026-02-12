/**
 * MSG91 SMS Integration for CareOps
 * Docs: https://docs.msg91.com/reference/send-sms
 */

interface MSG91SendOTPResponse {
  type: string;
  request_id: string;
  message: string;
}

interface MSG91VerifyOTPResponse {
  type: string;
  message: string;
}

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || "";
const MSG91_BASE_URL = "https://control.msg91.com/api/v5";

/**
 * Send OTP via MSG91
 */
export async function sendOTP(phone: string): Promise<{ success: boolean; requestId?: string; error?: string }> {
  if (!MSG91_AUTH_KEY) {
    console.warn("MSG91_AUTH_KEY not configured — skipping SMS OTP");
    return { success: false, error: "MSG91 not configured" };
  }

  try {
    // Ensure phone has country code
    const formattedPhone = phone.startsWith("+") ? phone.replace("+", "") : phone;
    
    const res = await fetch(`${MSG91_BASE_URL}/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=${formattedPhone}`, {
      method: "POST",
      headers: {
        "authkey": MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
    });

    const data: MSG91SendOTPResponse = await res.json();
    
    if (data.type === "success") {
      console.log(`MSG91 OTP sent to ${formattedPhone}`);
      return { success: true, requestId: data.request_id };
    }
    
    console.error("MSG91 send OTP error:", data);
    return { success: false, error: data.message || "Failed to send OTP" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("MSG91 OTP error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Verify OTP via MSG91
 */
export async function verifyOTP(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: "MSG91 not configured" };
  }

  try {
    const formattedPhone = phone.startsWith("+") ? phone.replace("+", "") : phone;
    
    const res = await fetch(`${MSG91_BASE_URL}/otp/verify?mobile=${formattedPhone}&otp=${otp}`, {
      method: "POST",
      headers: {
        "authkey": MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
    });

    const data: MSG91VerifyOTPResponse = await res.json();
    
    if (data.type === "success") {
      return { success: true };
    }
    
    return { success: false, error: data.message || "Invalid OTP" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("MSG91 verify error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Resend OTP via MSG91
 */
export async function resendOTP(phone: string, retryType: "text" | "voice" = "text"): Promise<{ success: boolean; error?: string }> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: "MSG91 not configured" };
  }

  try {
    const formattedPhone = phone.startsWith("+") ? phone.replace("+", "") : phone;
    
    const res = await fetch(`${MSG91_BASE_URL}/otp/retry?mobile=${formattedPhone}&retrytype=${retryType}`, {
      method: "POST",
      headers: {
        "authkey": MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return data.type === "success" 
      ? { success: true } 
      : { success: false, error: data.message || "Failed to resend OTP" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Send transactional SMS via MSG91
 */
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (!MSG91_AUTH_KEY) {
    console.warn("MSG91_AUTH_KEY not configured — skipping SMS");
    return false;
  }

  try {
    const formattedPhone = phone.startsWith("+") ? phone.replace("+", "") : phone;
    const countryCode = formattedPhone.substring(0, formattedPhone.length - 10);
    const mobileNo = formattedPhone.substring(formattedPhone.length - 10);
    
    const res = await fetch(`${MSG91_BASE_URL}/flow/`, {
      method: "POST",
      headers: {
        "authkey": MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID,
        short_url: "0",
        recipients: [
          {
            mobiles: formattedPhone,
            message: message,
          },
        ],
      }),
    });

    const data = await res.json();
    if (data.type === "success") {
      console.log(`MSG91 SMS sent to ${formattedPhone}`);
      return true;
    }
    console.error("MSG91 SMS error:", data);
    return false;
  } catch (error) {
    console.error("MSG91 SMS error:", error);
    return false;
  }
}
