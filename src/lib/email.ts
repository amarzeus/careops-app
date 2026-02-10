import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const host = process.env.EMAIL_HOST || "smtp.resend.com";
    const port = parseInt(process.env.EMAIL_PORT || "587");
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    console.log(`[Email Debug] Host: ${host}, Port: ${port}, User: ${user ? 'present' : 'MISSING'}, Pass: ${pass ? 'present' : 'MISSING'}`);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: user || undefined,
        pass: pass || undefined,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@careops.com",
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    // In development or if email fails, log the content so we can see the OTP
    if (process.env.NODE_ENV !== "production" || true) {
      console.log("------------------------------------------");
      console.log("EMAIL FAILED OR DEV MODE - LOGGING CONTENT");
      console.log("Subject:", options.subject);
      console.log("To:", options.to);
      console.log("HTML:", options.html);
      console.log("------------------------------------------");
    }
    return false;
  }
}

export function buildEmailTemplate(
  title: string,
  body: string,
  ctaText?: string,
  ctaUrl?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; }
    .header { background: #0f172a; color: white; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .body { padding: 32px; color: #334155; line-height: 1.6; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 16px; }
    .footer { padding: 16px 32px; background: #f8fafc; color: #94a3b8; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${title}</h1></div>
    <div class="body">
      ${body}
      ${ctaText && ctaUrl ? `<br><a href="${ctaUrl}" class="cta">${ctaText}</a>` : ""}
    </div>
    <div class="footer">Powered by CareOps</div>
  </div>
</body>
</html>`;
}
