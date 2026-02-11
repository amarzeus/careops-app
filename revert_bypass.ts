
import { prisma } from "./src/lib/prisma";

async function main() {
    const email = "dev@voewo.com";

    await prisma.user.update({
        where: { email },
        data: {
            emailVerified: null,
            otpCode: null, // Clear old code so they must generate a new one
            otpExpires: null
        }
    });

    console.log(`Reverted bypass for ${email}. User is now unverified.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
