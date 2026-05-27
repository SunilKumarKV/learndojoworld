import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // No product seed data yet. Keep Phase 1 schema foundation empty by default.
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
