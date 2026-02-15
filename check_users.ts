import { prisma } from "./src/lib/prisma";
import bcrypt from "bcryptjs";

async function check() {
    const users = await prisma.user.findMany({
        select: { email: true, passwordHash: true, role: true, emailVerified: true }
    });
    console.log("Existing users:", users.length);
    for (const user of users) {
        const isPasswordMatch = await bcrypt.compare("password", user.passwordHash);
        console.log(`- ${user.email} (${user.role}) - Verified: ${!!user.emailVerified} - Password matches 'password': ${isPasswordMatch}`);
    }
    await prisma.$disconnect();
}

check();
