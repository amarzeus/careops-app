
import { prisma } from "./src/lib/prisma";

async function main() {
    await prisma.user.update({
        where: { email: "dev@voewo.com" },
        data: { emailVerified: null, otpExpires: new Date(Date.now() - 3600000) }, // expire old OTP to allow resend
    });
    console.log("User unverifed");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
