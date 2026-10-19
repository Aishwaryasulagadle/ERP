import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function cleanAndResetDatabase() {
  console.log("Starting full database cleanup...");

  // 1. Delete all transactional, client, deliverable, and operational records
  await prisma.deliverableMetric.deleteMany();
  await prisma.deliverableLog.deleteMany();
  await prisma.clientService.deleteMany();
  await prisma.clientAssignment.deleteMany();
  await prisma.clientReport.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.employeeQuery.deleteMany();
  await prisma.salarySlip.deleteMany();
  await prisma.break.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.performanceRating.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();

  // 2. Clear all clients and non-admin employees/users
  await prisma.client.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  console.log("All existing records cleared successfully.");

  // 3. Create core standard departments
  const salesDept = await prisma.department.upsert({
    where: { name: "Sales" },
    update: {},
    create: {
      name: "Sales",
      description: "Inbound, outbound leads, customer deals, quotations, and closings",
    },
  });

  const digitalMarketingDept = await prisma.department.upsert({
    where: { name: "Digital Marketing" },
    update: {},
    create: {
      name: "Digital Marketing",
      description: "Social media marketing, Reels, Meta Ads, Graphic Design, and SEO",
    },
  });

  const techDept = await prisma.department.upsert({
    where: { name: "Technical & IT" },
    update: {},
    create: {
      name: "Technical & IT",
      description: "Software development, web applications, and tech delivery",
    },
  });

  // 4. Create core designations
  const adminDesig = await prisma.designation.upsert({
    where: { name: "Managing Director / Admin" },
    update: {},
    create: { name: "Managing Director / Admin", description: "System Administrator" },
  });

  await prisma.designation.upsert({
    where: { name: "Sales Manager" },
    update: {},
    create: { name: "Sales Manager", description: "Sales Pipeline & Management" },
  });

  await prisma.designation.upsert({
    where: { name: "Digital Marketing Manager" },
    update: {},
    create: { name: "Digital Marketing Manager", description: "Marketing Campaigns & Deliverables" },
  });

  await prisma.designation.upsert({
    where: { name: "Technical Project Manager" },
    update: {},
    create: { name: "Technical Project Manager", description: "Engineering & Technical Delivery" },
  });

  await prisma.designation.upsert({
    where: { name: "Senior Executive" },
    update: {},
    create: { name: "Senior Executive", description: "Execution and Operations" },
  });

  // 5. Create fresh Super Admin Account (info@jisnudigital.com / Jisnu123)
  const adminPasswordHash = await bcrypt.hash("Jisnu123", 10);
  const adminUser = await prisma.user.create({
    data: {
      name: "Jisnu Digital Admin",
      email: "info@jisnudigital.com",
      password: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      employeeCode: "EMP-001",
      userId: adminUser.id,
      phone: "+91 98765 43210",
      departmentId: techDept.id,
      designationId: adminDesig.id,
      salary: 0,
      employmentStatus: "ACTIVE",
    },
  });

  console.log("--------------------------------------------------");
  console.log("Database reset complete!");
  console.log("Super Admin Created:");
  console.log("  Email:    info@jisnudigital.com");
  console.log("  Password: Jisnu123");
  console.log("  Role:     ADMIN");
  console.log("  Emp Code: EMP-001");
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
}

cleanAndResetDatabase().catch((e) => {
  console.error("Error resetting database:", e);
  process.exit(1);
});
