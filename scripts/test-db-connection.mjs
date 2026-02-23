import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔌 Testing database connection...\n");

    // Test connection
    await prisma.$connect();
    console.log("✅ Successfully connected to database\n");

    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log("📊 Database version:");
    console.log(`   ${result[0].version}\n`);

    // Count tables
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    console.log(`📋 Tables in database: ${tables.length}`);
    tables.forEach((t) => console.log(`   - ${t.tablename}`));

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error(`   ${error.message}\n`);
    console.log("💡 Troubleshooting:");
    console.log("   1. Is PostgreSQL running? docker-compose ps");
    console.log("   2. Check DATABASE_URL in .env file");
    console.log("   3. View logs: docker-compose logs postgres");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
