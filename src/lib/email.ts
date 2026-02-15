
import nodemailer from "nodemailer";
import { prisma } from "./prisma";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  workspaceId?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
 *
 * @param options
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log(`Preparing to send email to: ${options.to}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${MAX_RETRIES} connecting to ${process.env.EMAIL_HOST}...`);

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);

      await logIntegration("email", "success", options.to, options.subject, undefined, options.workspaceId);

      // In development, log the email content for debugging
      if (process.env.NODE_ENV !== "production") {
        console.log("------------------------------------------");
        console.log("EMAIL SENT (DEV MODE) - LOGGING CONTENT");
        console.log("Subject:", options.subject);
        console.log("To:", options.to);
        console.log("HTML Preview:", options.html?.substring(0, 200) + "...");
        console.log("------------------------------------------");
      }

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

        if (process.env.NODE_ENV !== "production") {
          console.log("------------------------------------------");
          console.log("EMAIL FAILED - LOGGING CONTENT (DEV MODE)");
          console.log("Subject:", options.subject);
          console.log("To:", options.to);
          console.log("HTML Preview:", options.html);
          console.log("------------------------------------------");
        }
        return false;
      }
    }
  }
  return false;
}

/**
 *
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
