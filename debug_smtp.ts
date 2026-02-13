
// Load env vars first
import * as dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

async function main() {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587"),
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    console.log("Attempting to send with full logging...");

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: "dev@voewo.com",
            subject: "CareOps SMTP Debug Test",
            html: "<p>Debug email to check SMTP response.</p>"
        });

        console.log("✅ Email Sent Successfully!");
        console.log("Message ID:", info.messageId);
        console.log("Response:", info.response);
        console.log("Full Info:", JSON.stringify(info, null, 2));

    } catch (error) {
        console.error("❌ Email Failed:", error);
    }
}

main();
