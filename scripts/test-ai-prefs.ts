import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const workspace = await prisma.workspace.findFirst();
        if (!workspace) {
            console.log("No workspace found");
            return;
        }
        console.log("Checking AI preferences for workspace:", workspace.id);

        // Test the property name
        // @ts-ignore
        console.log("Prisma keys:", Object.keys(prisma).filter(k => k.toLowerCase().includes('pref')));

        // Try to find
        // @ts-ignore
        const prefs = await prisma.aIPreferences.findUnique({
            where: { workspaceId: workspace.id },
        });
        console.log("Prefs result:", prefs);

        if (!prefs) {
            console.log("Creating default prefs...");
            // @ts-ignore
            const newPrefs = await prisma.aIPreferences.create({
                data: { workspaceId: workspace.id },
            });
            console.log("Created prefs:", newPrefs);
        }
    } catch (error) {
        console.error("Error in test script:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
