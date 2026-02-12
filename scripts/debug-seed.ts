import { prisma } from "../src/lib/prisma";
import { createToken, hashPassword } from "../src/lib/auth";

async function main() {
    try {
        const email = `test-debug-${Date.now()}@example.com`;
        const name = "Debug User";
        const password = "password123";
        const status = "ACTIVE";
        const onboardingStep = 8;

        console.log("Starting seed for:", email);

        // Cleanup existing user if any
        await prisma.user.deleteMany({ where: { email } });
        console.log("Cleanup done");

        const workspace = await prisma.workspace.create({
            data: {
                name: `${name}'s Workspace`,
                status: status || "ONBOARDING",
                onboardingStep: onboardingStep || 1
            }
        });
        console.log("Workspace created:", workspace.id);

        const passwordHash = await hashPassword(password || "password123");
        console.log("Password hashed");

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role: "OWNER",
                workspaceId: workspace.id,
                emailVerified: new Date()
            }
        });
        console.log("User created:", user.id);

        const token = await createToken(user.id, workspace.id, user.role);
        console.log("Token created:", token);

        console.log("Seed successful!");
    } catch (error) {
        console.error("Seed error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
