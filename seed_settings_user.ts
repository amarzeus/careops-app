
import { prisma } from "./src/lib/prisma";
import { hashPassword } from "./src/lib/auth"; // Assuming this is exported, otherwise I'll reimplement hash.

// bcryptjs is used in auth.ts
import bcrypt from "bcryptjs";

async function main() {
    const email = "settings@test.com";
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log("User already exists, updating password...");
        await prisma.user.update({
            where: { id: existing.id },
            data: { passwordHash: hashedPassword }
        });
        console.log("User updated.");
        return;
    }

    // Create workspace first (or connect to existing)
    const workspace = await prisma.workspace.create({
        data: {
            name: "Settings Test Workspace",
            status: "ACTIVE"
        }
    });

    const user = await prisma.user.create({
        data: {
            email,
            name: "Settings Tester",
            passwordHash: hashedPassword,
            role: "OWNER",
            workspaceId: workspace.id,
            emailVerified: new Date()
        }
    });

    console.log(`Created user: ${user.email} with password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
