import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Inspecting database columns for 'status'...");

    try {
        const tableInfo: any[] = await prisma.$queryRaw`
      SELECT table_name, column_name, udt_name as data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND column_name = 'status';
    `;

        console.log("Found status columns:");
        console.table(tableInfo);

        const enumInfo: any[] = await prisma.$queryRaw`
      SELECT n.nspname as schema, t.typname as name 
      FROM pg_type t 
      LEFT JOIN pg_namespace n ON n.oid = t.typnamespace 
      WHERE (t.typtype = 'e' OR t.typname = 'WorkspaceStatus') AND n.nspname = 'public';
    `;

        console.log("Found enums/types:");
        console.table(enumInfo);

    } catch (error) {
        console.error("❌ Inspection failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
