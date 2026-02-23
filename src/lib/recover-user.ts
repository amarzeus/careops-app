import { prisma } from "./prisma";

/**
 * Recover user account by creating a new workspace if missing
 * Run with: npx tsx src/lib/recover-user.ts <email>
 */

/**
 * Initiates the password recovery process for a user.
 * @param email - The email of the user
 * @returns Object indicating success or failure
 */
export async function recoverUser(email: string) {
  console.log(`\n🚑 Recovering user: ${email}\n`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspace: true },
  });

  if (!user) {
    console.log("❌ User not found in database");
    console.log("   Cannot recover non-existent user");
    return;
  }

  console.log("👤 User Found:");
  console.log(`  ID: ${user.id}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Current Workspace ID: ${user.workspaceId || "NULL"}`);

  if (user.workspace) {
    console.log("\n✅ User already has a workspace!");
    console.log(`   Workspace: ${user.workspace.name} (${user.workspace.id})`);
    console.log("   No recovery needed.");
    return;
  }

  // Check if there are any orphaned workspaces (workspaces without users)
  console.log("\n🔍 Searching for orphaned workspaces...");
  const orphanedWorkspaces = await prisma.workspace.findMany({
    where: {
      NOT: {
        users: {
          some: {},
        },
      },
    },
    take: 5,
  });

  if (orphanedWorkspaces.length > 0) {
    console.log(`   Found ${orphanedWorkspaces.length} orphaned workspaces`);
    console.log("\n   Options:");
    orphanedWorkspaces.forEach((ws, idx) => {
      console.log(`   ${idx + 1}. ${ws.name} (${ws.id}) - Created: ${ws.createdAt}`);
    });
    console.log("\n   To link to one of these workspaces, run:");
    console.log(`   npx tsx src/lib/link-workspace.ts ${email} <workspace-id>`);
  }

  // Create new workspace
  console.log("\n🆕 Creating new workspace...");
  const workspace = await prisma.workspace.create({
    data: {
      name: `${user.name}'s Workspace`,
      status: "ONBOARDING",
      emailConfigured: !!(process.env.EMAIL_HOST && process.env.EMAIL_FROM),
      smsConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER),
    },
  });

  // Link workspace to user
  await prisma.user.update({
    where: { id: user.id },
    data: { workspaceId: workspace.id },
  });

  console.log(`\n✅ Recovery complete!`);
  console.log(`   New workspace: ${workspace.name} (${workspace.id})`);
  console.log(`   User can now log in and access the dashboard.`);
  console.log(`\n⚠️  Note: Previous data (if any) may still be in the database`);
  console.log(`   but associated with a different workspace or user account.`);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx src/lib/recover-user.ts <email>");
  console.error("\nThis script creates a new workspace for users who lost theirs.");
  process.exit(1);
}

recoverUser(email)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
