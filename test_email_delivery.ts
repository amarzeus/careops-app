
// Load env vars first
import * as dotenv from "dotenv";
dotenv.config();

import { sendEmail } from "./src/lib/email";

async function main() {
    console.log("Checking ENV vars:");
    console.log("HOST:", process.env.EMAIL_HOST);
    console.log("USER:", process.env.EMAIL_USER ? "******" : "MISSING");

    console.log("Attempting to send test email to dev@voewo.com...");

    const result = await sendEmail({
        to: "dev@voewo.com",
        subject: "CareOps Email Delivery Test (Retry 2)",
        html: "<p>This is a test to verify email delivery is working correctly via Resend.</p>"
    });

    if (result) {
        console.log("✅ Email function returned TRUE (Success)");
    } else {
        console.error("❌ Email function returned FALSE (Failed)");
    }
}

main()
    .catch((e) => {
        console.error("Script Error:", e);
    });
