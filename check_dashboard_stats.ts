
import { prisma } from "./src/lib/prisma";

async function main() {
    const contactsCount = await prisma.contact.count();
    const bookingsCount = await prisma.booking.count();
    const conversationsCount = await prisma.conversation.count();

    console.log("Dashboard Stats:");
    console.log(`Contacts (Leads): ${contactsCount}`);
    console.log(`Bookings: ${bookingsCount}`);
    console.log(`Conversations: ${conversationsCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
