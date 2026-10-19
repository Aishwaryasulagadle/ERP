const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const slips = await prisma.salarySlip.findMany();
  console.log('Total slips in DB:', slips.length);
  for (const s of slips) {
    console.log(`- ID: ${s.id}, Code: ${s.slipCode}, EmpId: ${s.employeeId}, Month/Year: ${s.month}/${s.year}`);
  }

  const emps = await prisma.employee.findMany({ include: { user: true } });
  console.log('\nTotal employees in DB:', emps.length);
  for (const e of emps) {
    console.log(`- ID: ${e.id}, Code: ${e.employeeCode}, Name: ${e.user?.name}, Role: ${e.user?.role}`);
  }
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
