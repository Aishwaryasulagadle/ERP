const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateQuota() {
  await prisma.employee.updateMany({
    where: { employeeCode: 'EMP-002' },
    data: { monthlyLeaveQuota: 1 }
  });
  const emp = await prisma.employee.findFirst({
    where: { employeeCode: 'EMP-002' }
  });
  console.log(`Updated ${emp.employeeCode} monthlyLeaveQuota to:`, emp.monthlyLeaveQuota);
}

updateQuota()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
