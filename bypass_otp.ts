
import { prisma } from "./src/lib/prisma";

async function main() {
    const email = "dev@voewo.com";

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log(`User ${email} not found.`);
        return;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: new Date(),
            otpCode: null,
            otpExpires: null
        }
    });

    console.log(`Successfully bypassed OTP for ${email}. You can now login.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
