import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking and seeding default user logins...");

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const managerPasswordHash = await bcrypt.hash("manager123", 10);
  const employeePasswordHash = await bcrypt.hash("password123", 10);

  // 1. Ensure Departments exist
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

  // 2. Ensure Designations exist
  const adminDesig = await prisma.designation.upsert({
    where: { name: "Managing Director / Admin" },
    update: {},
    create: { name: "Managing Director / Admin", description: "System Administrator" },
  });

  const salesManagerDesig = await prisma.designation.upsert({
    where: { name: "Sales Manager" },
    update: {},
    create: { name: "Sales Manager", description: "Leads Lead Pipeline & Sales Closures" },
  });

  const dmManagerDesig = await prisma.designation.upsert({
    where: { name: "Digital Marketing Manager" },
    update: {},
    create: { name: "Digital Marketing Manager", description: "Leads Marketing Campaigns & Deliverables" },
  });

  const techManagerDesig = await prisma.designation.upsert({
    where: { name: "Technical Project Manager" },
    update: {},
    create: { name: "Technical Project Manager", description: "Leads Engineering & Development" },
  });

  const seniorExecDesig = await prisma.designation.upsert({
    where: { name: "Senior Executive" },
    update: {},
    create: { name: "Senior Executive", description: "Execution and deliverables" },
  });

  // 3. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@erp.com" },
    update: { password: adminPasswordHash, role: "ADMIN" },
    create: {
      name: "Sarvesh Bhoite",
      email: "admin@erp.com",
      password: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const existingAdminEmp = await prisma.employee.findUnique({ where: { userId: adminUser.id } });
  if (existingAdminEmp) {
    await prisma.employee.update({
      where: { id: existingAdminEmp.id },
      data: { departmentId: techDept.id, designationId: adminDesig.id, salary: 200000 },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: "EMP-001",
        userId: adminUser.id,
        phone: "+91 98765 43210",
        departmentId: techDept.id,
        designationId: adminDesig.id,
        salary: 200000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  // 4. Sales Manager (Manages Leads, CRM, Quotations & Closings)
  const salesManagerUser = await prisma.user.upsert({
    where: { email: "salesmanager@erp.com" },
    update: { password: managerPasswordHash, role: "MANAGER" },
    create: {
      name: "Rohit Deshmukh",
      email: "salesmanager@erp.com",
      password: managerPasswordHash,
      role: "MANAGER",
    },
  });

  const existingSalesEmp = await prisma.employee.findUnique({ where: { userId: salesManagerUser.id } });
  if (existingSalesEmp) {
    await prisma.employee.update({
      where: { id: existingSalesEmp.id },
      data: { departmentId: salesDept.id, designationId: salesManagerDesig.id, salary: 130000 },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: `EMP-SLS-${Date.now().toString().slice(-4)}`,
        userId: salesManagerUser.id,
        phone: "+91 98456 12345",
        departmentId: salesDept.id,
        designationId: salesManagerDesig.id,
        salary: 130000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  // 5. Digital Marketing Manager (Manages Marketing Projects & Deliverables)
  const mktManagerUser = await prisma.user.upsert({
    where: { email: "priya@erp.com" },
    update: { password: managerPasswordHash, role: "MANAGER" },
    create: {
      name: "Priya Sharma",
      email: "priya@erp.com",
      password: managerPasswordHash,
      role: "MANAGER",
    },
  });

  const existingMktEmp = await prisma.employee.findUnique({ where: { userId: mktManagerUser.id } });
  if (existingMktEmp) {
    await prisma.employee.update({
      where: { id: existingMktEmp.id },
      data: { departmentId: digitalMarketingDept.id, designationId: dmManagerDesig.id, salary: 120000 },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: `EMP-MKT-${Date.now().toString().slice(-4)}`,
        userId: mktManagerUser.id,
        phone: "+91 98234 56789",
        departmentId: digitalMarketingDept.id,
        designationId: dmManagerDesig.id,
        salary: 120000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  // 6. Technical Manager (Manages Dev, Websites, Apps & Milestones)
  const techManagerUser = await prisma.user.upsert({
    where: { email: "techmanager@erp.com" },
    update: { password: managerPasswordHash, role: "MANAGER" },
    create: {
      name: "Vikram Rathore",
      email: "techmanager@erp.com",
      password: managerPasswordHash,
      role: "MANAGER",
    },
  });

  const existingTechEmp = await prisma.employee.findUnique({ where: { userId: techManagerUser.id } });
  if (existingTechEmp) {
    await prisma.employee.update({
      where: { id: existingTechEmp.id },
      data: { departmentId: techDept.id, designationId: techManagerDesig.id, salary: 135000 },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: `EMP-TCH-${Date.now().toString().slice(-4)}`,
        userId: techManagerUser.id,
        phone: "+91 98111 22334",
        departmentId: techDept.id,
        designationId: techManagerDesig.id,
        salary: 135000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  // 7. Sales Department Staff (2 Employees)
  const salesEmp1User = await prisma.user.upsert({
    where: { email: "vikas.sales@erp.com" },
    update: { password: employeePasswordHash, role: "EMPLOYEE" },
    create: {
      name: "Vikas Patil",
      email: "vikas.sales@erp.com",
      password: employeePasswordHash,
      role: "EMPLOYEE",
    },
  });
  const existingVikas = await prisma.employee.findUnique({ where: { userId: salesEmp1User.id } });
  if (existingVikas) {
    await prisma.employee.update({
      where: { id: existingVikas.id },
      data: { departmentId: salesDept.id },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: `EMP-SLS1-${Date.now().toString().slice(-4)}`,
        userId: salesEmp1User.id,
        phone: "+91 98888 11111",
        departmentId: salesDept.id,
        designationId: seniorExecDesig.id,
        salary: 50000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  const salesEmp2User = await prisma.user.upsert({
    where: { email: "pooja.sales@erp.com" },
    update: { password: employeePasswordHash, role: "EMPLOYEE" },
    create: {
      name: "Pooja Kadam",
      email: "pooja.sales@erp.com",
      password: employeePasswordHash,
      role: "EMPLOYEE",
    },
  });
  const existingPooja = await prisma.employee.findUnique({ where: { userId: salesEmp2User.id } });
  if (existingPooja) {
    await prisma.employee.update({
      where: { id: existingPooja.id },
      data: { departmentId: salesDept.id },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: `EMP-SLS2-${Date.now().toString().slice(-4)}`,
        userId: salesEmp2User.id,
        phone: "+91 98888 22222",
        departmentId: salesDept.id,
        designationId: seniorExecDesig.id,
        salary: 52000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  // 8. Digital Marketing Department Staff (2 Employees: Rahul & Sneha)
  const rahulUser = await prisma.user.upsert({
    where: { email: "rahul@erp.com" },
    update: { password: employeePasswordHash, role: "EMPLOYEE" },
    create: {
      name: "Rahul Verma",
      email: "rahul@erp.com",
      password: employeePasswordHash,
      role: "EMPLOYEE",
    },
  });
  const existingRahulEmp = await prisma.employee.findUnique({ where: { userId: rahulUser.id } });
  if (existingRahulEmp) {
    await prisma.employee.update({
      where: { id: existingRahulEmp.id },
      data: { departmentId: digitalMarketingDept.id },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: `EMP-MKT1-${Date.now().toString().slice(-4)}`,
        userId: rahulUser.id,
        phone: "+91 97123 45678",
        departmentId: digitalMarketingDept.id,
        designationId: seniorExecDesig.id,
        salary: 65000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  const snehaUser = await prisma.user.upsert({
    where: { email: "sneha.mkt@erp.com" },
    update: { password: employeePasswordHash, role: "EMPLOYEE" },
    create: {
      name: "Sneha Nair",
      email: "sneha.mkt@erp.com",
      password: employeePasswordHash,
      role: "EMPLOYEE",
    },
  });
  const existingSneha = await prisma.employee.findUnique({ where: { userId: snehaUser.id } });
  if (existingSneha) {
    await prisma.employee.update({
      where: { id: existingSneha.id },
      data: { departmentId: digitalMarketingDept.id },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: `EMP-MKT2-${Date.now().toString().slice(-4)}`,
        userId: snehaUser.id,
        phone: "+91 97999 33333",
        departmentId: digitalMarketingDept.id,
        designationId: seniorExecDesig.id,
        salary: 62000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  // 9. Technical & IT Department Staff (2 Employees: Amit & Neha)
  const amitUser = await prisma.user.upsert({
    where: { email: "amit@erp.com" },
    update: { password: employeePasswordHash, role: "EMPLOYEE" },
    create: {
      name: "Amit Patel",
      email: "amit@erp.com",
      password: employeePasswordHash,
      role: "EMPLOYEE",
    },
  });
  const existingAmitEmp = await prisma.employee.findUnique({ where: { userId: amitUser.id } });
  if (existingAmitEmp) {
    await prisma.employee.update({
      where: { id: existingAmitEmp.id },
      data: { departmentId: techDept.id },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: `EMP-TCH1-${Date.now().toString().slice(-4)}`,
        userId: amitUser.id,
        phone: "+91 96543 21098",
        departmentId: techDept.id,
        designationId: seniorExecDesig.id,
        salary: 60000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  const nehaUser = await prisma.user.upsert({
    where: { email: "neha.tech@erp.com" },
    update: { password: employeePasswordHash, role: "EMPLOYEE" },
    create: {
      name: "Neha Joshi",
      email: "neha.tech@erp.com",
      password: employeePasswordHash,
      role: "EMPLOYEE",
    },
  });
  const existingNeha = await prisma.employee.findUnique({ where: { userId: nehaUser.id } });
  if (existingNeha) {
    await prisma.employee.update({
      where: { id: existingNeha.id },
      data: { departmentId: techDept.id },
    });
  } else {
    await prisma.employee.create({
      data: {
        employeeCode: `EMP-TCH2-${Date.now().toString().slice(-4)}`,
        userId: nehaUser.id,
        phone: "+91 96777 44444",
        departmentId: techDept.id,
        designationId: seniorExecDesig.id,
        salary: 68000,
        employmentStatus: "ACTIVE",
      },
    });
  }

  console.log("----------------------------------------------------------------------");
  console.log("3 Departments, 3 Managers, 2 Employees per Dept seeded successfully!");
  console.log("----------------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Setup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
