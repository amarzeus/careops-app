
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

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
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY * attempt}ms...`);
        await sleep(RETRY_DELAY * attempt);
      } else {
        console.error("All delivery attempts failed.");

        // Log content on final failure too
        if (process.env.NODE_ENV !== "production") {
          console.log("------------------------------------------");
          console.log("EMAIL FAILED - LOGGING CONTENT");
          console.log("Subject:", options.subject);
          console.log("To:", options.to);
          console.log("------------------------------------------");
        }
        return false;
      }
    }
  }
  return false;
}

export function buildEmailTemplate(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">${title}</h1>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
            ${content}
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            This email was sent from CareOps.
          </p>
        </div>
      </body>
    </html>
  `;
}
