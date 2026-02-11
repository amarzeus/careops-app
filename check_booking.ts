
import { prisma } from "./src/lib/prisma";

async function main() {
    const booking = await prisma.booking.findFirst({
        where: { contact: { email: "booker@example.com" } },
        include: { contact: true, service: true },
    });
    console.log("Booking:", booking);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
