
import { prisma } from "./prisma";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  workspaceId?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Sleeping utility for delays.
 * @param ms - Milliseconds to sleep
 */
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logs integration events to the database.
 * @param type - Integration type (email, sms, etc.)
 * @param status - Status (success, failed)
 * @param to - Recipient
 * @param message - Message subject or content summary
 * @param error - Error message if failed
 * @param workspaceId - Workspace ID
 */
async function logIntegration(type: string, status: string, to: string, message: string, error?: string, workspaceId?: string) {
  if (!workspaceId) return;

  try {
    await prisma.integrationLog.create({
      data: {
        type,
        status,
        to,
        message,
        error,
        workspaceId,
      },
    });
  } catch (e) {
    console.error("Failed to log integration:", e);
  }
}

/**
 * Sends an email using the Resend API via HTTPS.
 * This is more reliable than SMTP on platforms like Render where SMTP ports might be blocked.
 * @param options
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log(`Preparing to send email to: ${options.to} via Resend API`);

  const apiKey = process.env.EMAIL_PASS; // Using the existing EMAIL_PASS as the Resend API Key
  const from = process.env.EMAIL_FROM || "CareOps <onboarding@resend.dev>";

  if (!apiKey) {
    console.error("RESEND_API_KEY (EMAIL_PASS) is missing");
    return false;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${MAX_RETRIES} sending via Resend API...`);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: from,
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Resend API error: ${response.status}`);
      }

      console.log(`✅ Email sent successfully! Message ID: ${data.id}`);

      await logIntegration("email", "success", options.to, options.subject, undefined, options.workspaceId);

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Attempt ${attempt} failed:`, message);

      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY * attempt}ms...`);
        await sleep(RETRY_DELAY * attempt);
      } else {
        console.error("All delivery attempts failed.");

        const errorMsg = `Failed to send "${options.subject}" to ${options.to} after ${MAX_RETRIES} attempts`;

        await logIntegration("email", "failed", options.to, options.subject, message, options.workspaceId);

        if (options.workspaceId) {
          try {
            await prisma.alert.create({
              data: {
                type: "automation",
                title: "Email Delivery Failed",
                message: errorMsg,
                actionUrl: "/inbox",
                workspaceId: options.workspaceId,
              },
            });
          } catch (e) {
            console.error("Failed to create failure alert:", e);
          }
        }
        return false;
      }
    }
  }
  return false;
}

/**
 * Builds HTML template for emails.
 * @param title
 * @param content
 * @param buttonText
 * @param buttonUrl
 */
export function buildEmailTemplate(
  title: string,
  content: string,
  buttonText?: string,
  buttonUrl?: string
): string {
  const ctaBlock =
    buttonText && buttonUrl
      ? `<div style="text-align: center; margin-top: 24px;">
           <a href="${buttonUrl}" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">${buttonText}</a>
         </div>`
      : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background-color: #2563eb; padding: 24px 32px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">${title}</h1>
          </div>
          <div style="padding: 32px;">
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              ${content}
            </div>
            ${ctaBlock}
          </div>
          <div style="padding: 16px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
              This email was sent from CareOps. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
