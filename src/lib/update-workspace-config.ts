import { prisma } from "./prisma";
import dotenv from "dotenv";

dotenv.config();

/**
 * Update workspace email/SMS configuration based on environment variables
 * Run this script when environment variables are configured but workspace flags are not set
 */

async function updateWorkspaceConfig() {
  const workspaceId = process.argv[2];
  
  if (!workspaceId) {
    console.error("❌ Please provide workspace ID as argument");
    console.log("Usage: npx tsx src/lib/update-workspace-config.ts <workspace-id>");
    process.exit(1);
  }

  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailFrom = process.env.EMAIL_FROM;
  
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const updateData: any = {};

  // Check if email is configured in environment
  const emailConfigured = !!(emailHost && emailPort && emailUser && emailPass && emailFrom);
  if (emailConfigured) {
    updateData.emailConfigured = true;
    updateData.emailProvider = "smtp";
    updateData.emailFromAddress = emailFrom;
    updateData.emailFromName = emailFrom?.split("@")[0] || "CareOps";
    console.log("✅ Email configuration detected");
  } else {
    console.log("⚠️ Email environment variables not fully configured");
    console.log("  Required: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM");
  }

  // Check if SMS is configured in environment
  const smsConfigured = !!(twilioAccountSid && twilioAuthToken && twilioPhoneNumber);
  if (smsConfigured) {
    updateData.smsConfigured = true;
    updateData.smsProvider = "twilio";
    updateData.smsFromNumber = twilioPhoneNumber;
    console.log("✅ SMS configuration detected");
  } else {
    console.log("⚠️ SMS environment variables not fully configured");
    console.log("  Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
  }

  if (Object.keys(updateData).length === 0) {
    console.log("\n❌ No configuration updates needed - environment variables not set");
    process.exit(0);
  }

  try {
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
    });

    console.log("\n✅ Workspace updated successfully:");
    console.log(`  ID: ${workspace.id}`);
    console.log(`  Name: ${workspace.name}`);
    console.log(`  Email Configured: ${workspace.emailConfigured}`);
    console.log(`  SMS Configured: ${workspace.smsConfigured}`);
    
    if (updateData.emailConfigured) {
      console.log(`  Email From: ${updateData.emailFromAddress}`);
    }
    if (updateData.smsConfigured) {
      console.log(`  SMS From: ${updateData.smsFromNumber}`);
    }
    
    console.log("\n🎉 Email and SMS are now enabled!");
  } catch (error) {
    console.error("\n❌ Failed to update workspace:", error);
    process.exit(1);
  }
}

updateWorkspaceConfig()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
