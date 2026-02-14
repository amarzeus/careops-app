import { prisma } from "./prisma";

/**
 * Check user and workspace status
 * Run with: npx tsx src/lib/check-user.ts <email>
 */

async function checkUser(email: string) {
  console.log(`\n🔍 Checking user: ${email}\n`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspace: true },
  });

  if (!user) {
    console.log("❌ User not found in database");
    return;
  }

  console.log("👤 User Details:");
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Role: ${user.role}`);
  console.log(`  Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
  console.log(`  Has Password: ${user.passwordHash ? '✅ Yes' : '❌ No'}`);
  console.log(`  Google ID: ${user.googleId || 'Not linked'}`);
  console.log(`  Workspace ID: ${user.workspaceId || '❌ NULL - No workspace!'}`);
  console.log(`  Created: ${user.createdAt}`);
  console.log(`  Updated: ${user.updatedAt}`);

  if (user.workspace) {
    console.log("\n🏢 Workspace Details:");
    console.log(`  ID: ${user.workspace.id}`);
    console.log(`  Name: ${user.workspace.name}`);
    console.log(`  Status: ${user.workspace.status}`);
    console.log(`  Onboarding Step: ${user.workspace.onboardingStep}`);
    console.log(`  Created: ${user.workspace.createdAt}`);
  } else {
    console.log("\n⚠️  WARNING: User has no workspace associated!");
    console.log("   This means all previous data (contacts, bookings, etc.) is inaccessible.");
    console.log("\n💡 Possible causes:");
    console.log("   1. Account was created via Google OAuth (doesn't auto-create workspace)");
    console.log("   2. Workspace was accidentally deleted");
    console.log("   3. Database inconsistency");
  }

  // Count related data
  if (user.workspaceId) {
    const [contacts, bookings, services] = await Promise.all([
      prisma.contact.count({ where: { workspaceId: user.workspaceId } }),
      prisma.booking.count({ where: { workspaceId: user.workspaceId } }),
      prisma.service.count({ where: { workspaceId: user.workspaceId } }),
    ]);

    console.log("\n📊 Workspace Data:");
    console.log(`  Contacts: ${contacts}`);
    console.log(`  Bookings: ${bookings}`);
    console.log(`  Services: ${services}`);
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx src/lib/check-user.ts <email>");
  process.exit(1);
}

checkUser(email)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
