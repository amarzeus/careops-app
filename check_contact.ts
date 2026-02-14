
import { prisma } from "./src/lib/prisma";

async function main() {
    const contact = await prisma.contact.findFirst({
        where: { email: "testclient@example.com" },
        include: { conversation: true },
    });
    console.log("Contact:", contact);
    console.log("Conversation:", contact?.conversation);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
