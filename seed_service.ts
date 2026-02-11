
import { prisma } from "./src/lib/prisma";

async function main() {
    const workspace = await prisma.workspace.findFirst();

    if (!workspace) {
        throw new Error("No workspace found");
    }

    console.log(`Seeding service for workspace: ${workspace.name} (${workspace.id})`);

    // Create or update a service
    const service = await prisma.service.create({
        data: {
            name: "General Consultation",
            description: "A 30-minute consultation to discuss your needs.",
            duration: 30,
            price: 50.0,
            isActive: true,
            workspaceId: workspace.id,
            availableDays: "1,2,3,4,5", // Mon-Fri
            startTime: "09:00",
            endTime: "17:00",
        },
    });

    console.log("Service created:", service);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
