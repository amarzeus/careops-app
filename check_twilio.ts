import * as dotenv from "dotenv";
import * as path from "path";

const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

async function runCheck() {
    console.log("Checking Twilio configuration...");
    console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? "SET" : "NOT SET");

    // Dynamic import to avoid hoisting
    const { checkTwilioHealth, isConfigured } = await import("./src/lib/twilio");

    if (!isConfigured()) {
        console.error("Twilio is NOT configured according to isConfigured()!");
        return;
    }

    try {
        console.log("Fetching account details...");
        const health = await checkTwilioHealth();
        if (health.healthy) {
            console.log("Twilio is HEALTHY!");
            console.log("Account Status:", health.balance);
        } else {
            console.error("Twilio is UNHEALTHY!");
            console.error("Error:", health.error);
        }
    } catch (error) {
        console.error("Failed to check health:", error);
    }
}

runCheck();
