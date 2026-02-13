
import { prisma } from "./src/lib/prisma";

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "dev@voewo.com" },
    });
    console.log("OTP:", user?.otpCode);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
