import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("Recent Alerts:");
  console.log(JSON.stringify(alerts, null, 2));

  const automationLogs = await prisma.automationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("\nRecent Automation Logs:");
  console.log(JSON.stringify(automationLogs, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
