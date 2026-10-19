const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAdminData() {
  // 1. Delete any salary slips belonging to ADMIN users
  const adminSlips = await prisma.salarySlip.findMany({
    where: { employee: { user: { role: 'ADMIN' } } }
  });
  console.log(`Found ${adminSlips.length} admin salary slip(s). Deleting...`);
  if (adminSlips.length > 0) {
    await prisma.salarySlip.deleteMany({
      where: { employee: { user: { role: 'ADMIN' } } }
    });
  }

  // 2. Clear pre-seeded holidays so holidays calendar starts completely fresh
  const count = await prisma.holiday.count();
  console.log(`Found ${count} holidays. Clearing...`);
  await prisma.holiday.deleteMany({});
  console.log('Holidays table cleared successfully.');
}

cleanAdminData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
