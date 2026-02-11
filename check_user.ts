
import { prisma } from "./src/lib/prisma";

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "dev@voewo.com" },
    });

    if (user) {
        console.log(`User found: ${user.email} (ID: ${user.id})`);
    } else {
        console.log("User dev@voewo.com not found.");
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
