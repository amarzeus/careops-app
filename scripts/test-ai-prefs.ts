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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log("Prisma keys:", Object.keys(prisma as any).filter(k => k.toLowerCase().includes('pref')));

        // Try to find - use any to bypass type check for dynamic model
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prefs = await (prisma as any).aIPreferences.findUnique({
            where: { workspaceId: workspace.id },
        });
        console.log("Prefs result:", prefs);

        if (!prefs) {
            console.log("Creating default prefs...");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newPrefs = await (prisma as any).aIPreferences.create({
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
