
import { prisma } from "./src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    const email = "dev@voewo.com";
    const newPassword = "devpassword123";
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });
        console.log(`Password for ${email} has been reset to: ${newPassword}`);
    } else {
        console.log(`User ${email} not found.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
