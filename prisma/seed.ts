import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";


async function main() {
  console.log("Seeding ERP Database...");

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.break.deleteMany();
  await prisma.attendance.deleteMany();
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
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("admin123", 10);
  const empPasswordHash = await bcrypt.hash("password123", 10);

  // Departments
  const salesDept = await prisma.department.create({
    data: {
      name: "Sales & Marketing",
      description: "Handles outbound, inbound leads, quotations, and deals",
    },
  });

  const engineeringDept = await prisma.department.create({
    data: {
      name: "Engineering & IT",
      description: "Software development and infrastructure management",
    },
  });

  const hrDept = await prisma.department.create({
    data: {
      name: "Human Resources",
      description: "People operations, talent acquisition, and payroll",
    },
  });

  const operationsDept = await prisma.department.create({
    data: {
      name: "Operations & Delivery",
      description: "Client success and project delivery",
    },
  });

  // Designations
  const desigAdmin = await prisma.designation.create({
    data: { name: "Chief Executive Officer / Admin", description: "ERP Administrator" },
  });
  const desigSalesManager = await prisma.designation.create({
    data: { name: "Sales Manager", description: "Leads the sales team" },
  });
  const desigSrSalesExec = await prisma.designation.create({
    data: { name: "Senior Sales Executive", description: "Closes key enterprise accounts" },
  });
  const desigSalesExec = await prisma.designation.create({
    data: { name: "Sales Executive", description: "Lead generation and qualification" },
  });
  const desigTechLead = await prisma.designation.create({
    data: { name: "Technical Lead", description: "Engineering task owner" },
  });

  // 1. Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: "Sarvesh Bhoite",
      email: "admin@erp.com",
      password: passwordHash,
      role: "ADMIN",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const adminEmp = await prisma.employee.create({
    data: {
      employeeCode: "EMP-001",
      userId: adminUser.id,
      phone: "+91 98765 43210",
      departmentId: operationsDept.id,
      designationId: desigAdmin.id,
      salary: 250000,
      employmentStatus: "ACTIVE",
      address: "101 Executive Enclave, Cyber Hub, Gurugram, India",
      emergencyContact: "+91 98765 00000 (Spouse)",
    },
  });

  // 2. Manager User
  const managerUser = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@erp.com",
      password: empPasswordHash,
      role: "MANAGER",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const managerEmp = await prisma.employee.create({
    data: {
      employeeCode: "EMP-002",
      userId: managerUser.id,
      phone: "+91 98234 56789",
      departmentId: salesDept.id,
      designationId: desigSalesManager.id,
      managerId: adminEmp.id,
      salary: 140000,
      employmentStatus: "ACTIVE",
      address: "42 Golf Course Road, Gurugram, India",
      emergencyContact: "+91 98234 11111 (Father)",
    },
  });

  // 3. Employee 1 (Rahul)
  const rahulUser = await prisma.user.create({
    data: {
      name: "Rahul Verma",
      email: "rahul@erp.com",
      password: empPasswordHash,
      role: "EMPLOYEE",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const rahulEmp = await prisma.employee.create({
    data: {
      employeeCode: "EMP-003",
      userId: rahulUser.id,
      phone: "+91 97123 45678",
      departmentId: salesDept.id,
      designationId: desigSrSalesExec.id,
      managerId: managerEmp.id,
      salary: 75000,
      employmentStatus: "ACTIVE",
      address: "Sector 14, Noida, UP, India",
      emergencyContact: "+91 97123 99999 (Mother)",
    },
  });

  // 4. Employee 2 (Amit)
  const amitUser = await prisma.user.create({
    data: {
      name: "Amit Patel",
      email: "amit@erp.com",
      password: empPasswordHash,
      role: "EMPLOYEE",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const amitEmp = await prisma.employee.create({
    data: {
      employeeCode: "EMP-004",
      userId: amitUser.id,
      phone: "+91 96543 21098",
      departmentId: salesDept.id,
      designationId: desigSalesExec.id,
      managerId: managerEmp.id,
      salary: 60000,
      employmentStatus: "ACTIVE",
      address: "Indiranagar, Bengaluru, Karnataka, India",
      emergencyContact: "+91 96543 88888 (Brother)",
    },
  });

  // Products & Services
  const prodERP = await prisma.product.create({
    data: {
      name: "Enterprise ERP Cloud Suite (Annual)",
      sku: "PROD-ERP-ENT",
      description: "Full suite ERP for 100+ users including CRM, Sales, HR, Attendance, & Invoicing",
      price: 180000,
      stock: 999,
    },
  });

  const prodCRM = await prisma.product.create({
    data: {
      name: "CRM Pro Edition",
      sku: "PROD-CRM-PRO",
      description: "Dedicated lead tracking, pipeline automation, and omnichannel integration",
      price: 65000,
      stock: 999,
    },
  });

  const prodImplementation = await prisma.product.create({
    data: {
      name: "Custom ERP Implementation & Migration Package",
      sku: "SERV-IMP-MIG",
      description: "Onsite workflow customization, legacy data ingestion, and staff training",
      price: 85000,
      stock: 50,
    },
  });

  // Customers
  const cust1 = await prisma.customer.create({
    data: {
      name: "JDS Global Logistics",
      email: "contact@JDSlogistics.com",
      phone: "+91 99887 76655",
      company: "JDS Logistics Ltd.",
      address: "Bandra Kurla Complex, Mumbai",
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      name: "NexGen Healthcare Solutions",
      email: "procurement@nexgenhealth.in",
      phone: "+91 91234 56780",
      company: "NexGen Health Pvt Ltd",
      address: "Hitec City, Hyderabad",
    },
  });

  const cust3 = await prisma.customer.create({
    data: {
      name: "Zenith Retail Chains",
      email: "operations@zenithretail.com",
      phone: "+91 93456 78901",
      company: "Zenith Retailers Inc",
      address: "Connaught Place, New Delhi",
    },
  });

  // Leads
  const lead1 = await prisma.lead.create({
    data: {
      leadCode: "LEAD-101",
      customerName: "Aarav Kapoor",
      company: "JDS Global Logistics",
      phone: "+91 99887 76655",
      email: "contact@JDSlogistics.com",
      location: "Mumbai",
      source: "WEBSITE",
      productInterest: "Enterprise ERP Cloud Suite (Annual)",
      expectedValue: 265000,
      assignedToId: rahulEmp.id,
      customerId: cust1.id,
      status: "CONVERTED",
      priority: "HIGH",
      notes: "Requirements finalized. Deal closed for ERP + Implementation.",
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      leadCode: "LEAD-102",
      customerName: "Dr. Sunita Rao",
      company: "NexGen Healthcare Solutions",
      phone: "+91 91234 56780",
      email: "procurement@nexgenhealth.in",
      location: "Hyderabad",
      source: "GOOGLE",
      productInterest: "Enterprise ERP Cloud Suite (Annual)",
      expectedValue: 180000,
      assignedToId: rahulEmp.id,
      customerId: cust2.id,
      status: "CONVERTED",
      priority: "HIGH",
      notes: "Signed proposal. Awaiting deployment schedule.",
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      leadCode: "LEAD-103",
      customerName: "Rajesh Singhania",
      company: "Zenith Retail Chains",
      phone: "+91 93456 78901",
      email: "operations@zenithretail.com",
      location: "Delhi NCR",
      source: "REFERRAL",
      productInterest: "CRM Pro Edition",
      expectedValue: 150000,
      assignedToId: amitEmp.id,
      customerId: cust3.id,
      status: "CONVERTED",
      priority: "MEDIUM",
      notes: "Closed CRM subscription with custom reporting add-on.",
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      leadCode: "LEAD-104",
      customerName: "Deepak Mehra",
      company: "Mehra Manufacturing Group",
      phone: "+91 98111 22334",
      email: "dmehra@mehramfg.com",
      location: "Pune",
      source: "WHATSAPP",
      productInterest: "Enterprise ERP Cloud Suite (Annual)",
      expectedValue: 320000,
      assignedToId: rahulEmp.id,
      status: "FOLLOW_UP",
      priority: "URGENT",
      followUpDate: new Date(Date.now() + 24 * 3600 * 1000),
      notes: "Scheduled product demo with VP of Operations tomorrow 3:00 PM.",
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      leadCode: "LEAD-105",
      customerName: "Kavita Nair",
      company: "Horizon Edutech Solutions",
      phone: "+91 97444 55667",
      email: "kavita@horizonedu.io",
      location: "Kochi",
      source: "INSTAGRAM",
      productInterest: "CRM Pro Edition",
      expectedValue: 65000,
      assignedToId: amitEmp.id,
      status: "QUALIFIED",
      priority: "MEDIUM",
      followUpDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      notes: "Budget approved. Sent standard quotation.",
    },
  });

  const lead6 = await prisma.lead.create({
    data: {
      leadCode: "LEAD-106",
      customerName: "Sanjay Bose",
      company: "Bengal FinTech Labs",
      phone: "+91 96333 44556",
      email: "sbose@bengalfintech.com",
      location: "Kolkata",
      source: "WEBSITE",
      productInterest: "Enterprise ERP Cloud Suite (Annual)",
      expectedValue: 180000,
      assignedToId: managerEmp.id,
      status: "NEW",
      priority: "HIGH",
      notes: "Inbound form submission requesting immediate sales call.",
    },
  });

  // Lead Follow-ups & Activities
  await prisma.followUp.createMany({
    data: [
      {
        leadId: lead4.id,
        scheduledDate: new Date(Date.now() + 24 * 3600 * 1000),
        notes: "Executive demo for ERP inventory and billing modules",
        status: "PENDING",
      },
      {
        leadId: lead5.id,
        scheduledDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        notes: "Follow up on Quotation QT-2026-004 review",
        status: "PENDING",
      },
    ],
  });

  // Orders / Sales (Matching prompt: Rahul ₹2.5L+, Priya ₹1.8L+, Amit ₹1.2L+)
  const order1 = await prisma.order.create({
    data: {
      orderCode: "ORD-2026-001",
      customerId: cust1.id,
      employeeId: rahulEmp.id,
      leadId: lead1.id,
      totalAmount: 265000,
      discount: 0,
      tax: 47700,
      paymentStatus: "PAID",
      notes: "JDS Logistics Annual ERP + Onsite Migration Package",
      saleDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      orderItems: {
        create: [
          {
            productId: prodERP.id,
            itemTitle: "Enterprise ERP Cloud Suite (Annual)",
            quantity: 1,
            unitPrice: 180000,
            total: 180000,
          },
          {
            productId: prodImplementation.id,
            itemTitle: "Custom ERP Implementation & Migration Package",
            quantity: 1,
            unitPrice: 85000,
            total: 85000,
          },
        ],
      },
      invoices: {
        create: {
          invoiceCode: "INV-2026-001",
          dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
          totalAmount: 312700,
          paymentStatus: "PAID",
        },
      },
      payments: {
        create: {
          paymentCode: "PAY-2026-001",
          amount: 312700,
          paymentMethod: "NEFT / Bank Transfer",
          paymentStatus: "PAID",
          notes: "Received full payment via HDFC Bank Ref #77890123",
        },
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderCode: "ORD-2026-002",
      customerId: cust2.id,
      employeeId: managerEmp.id,
      leadId: lead2.id,
      totalAmount: 180000,
      discount: 0,
      tax: 32400,
      paymentStatus: "PAID",
      notes: "NexGen Healthcare Cloud Subscription",
      saleDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      orderItems: {
        create: [
          {
            productId: prodERP.id,
            itemTitle: "Enterprise ERP Cloud Suite (Annual)",
            quantity: 1,
            unitPrice: 180000,
            total: 180000,
          },
        ],
      },
      invoices: {
        create: {
          invoiceCode: "INV-2026-002",
          dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
          totalAmount: 212400,
          paymentStatus: "PAID",
        },
      },
      payments: {
        create: {
          paymentCode: "PAY-2026-002",
          amount: 212400,
          paymentMethod: "Corporate Credit Card",
          paymentStatus: "PAID",
        },
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderCode: "ORD-2026-003",
      customerId: cust3.id,
      employeeId: amitEmp.id,
      leadId: lead3.id,
      totalAmount: 120000,
      discount: 10000,
      tax: 21600,
      paymentStatus: "PAID",
      notes: "Zenith Retail Chains CRM deployment",
      saleDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      orderItems: {
        create: [
          {
            productId: prodCRM.id,
            itemTitle: "CRM Pro Edition (2 Licenses)",
            quantity: 2,
            unitPrice: 65000,
            total: 130000,
          },
        ],
      },
      invoices: {
        create: {
          invoiceCode: "INV-2026-003",
          dueDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
          totalAmount: 141600,
          paymentStatus: "PAID",
        },
      },
      payments: {
        create: {
          paymentCode: "PAY-2026-003",
          amount: 141600,
          paymentMethod: "Online Gateway",
          paymentStatus: "PAID",
        },
      },
    },
  });

  // Attendance Records for Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkInTime = new Date(today);
  checkInTime.setHours(9, 30, 0, 0);

  const checkOutTime = new Date(today);
  checkOutTime.setHours(18, 0, 0, 0);

  await prisma.attendance.createMany({
    data: [
      {
        employeeId: adminEmp.id,
        date: today,
        checkIn: checkInTime,
        breakDurationMin: 45,
        workingHoursMin: 465,
        status: "PRESENT",
      },
      {
        employeeId: managerEmp.id,
        date: today,
        checkIn: checkInTime,
        breakDurationMin: 60,
        workingHoursMin: 450,
        status: "PRESENT",
      },
      {
        employeeId: rahulEmp.id,
        date: today,
        checkIn: checkInTime,
        breakDurationMin: 60,
        workingHoursMin: 495, // 8h 15m as specified in prompt
        status: "PRESENT",
      },
      {
        employeeId: amitEmp.id,
        date: today,
        checkIn: new Date(today.getTime() + 10 * 3600 * 1000), // 10:00 AM (Late)
        breakDurationMin: 30,
        workingHoursMin: 450,
        status: "PRESENT",
      },
    ],
  });

  // Tasks
  const task1 = await prisma.task.create({
    data: {
      taskCode: "TSK-101",
      title: "Deliver Q3 Enterprise ERP Onboarding Workshop",
      description: "Conduct 3-day deep dive training for JDS Logistics functional leads and team admins.",
      assignedToId: rahulEmp.id,
      createdById: managerEmp.id,
      priority: "HIGH",
      dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      estimatedHours: 16,
      actualHours: 14,
      status: "IN_PROGRESS",
    },
  });

  const task2 = await prisma.task.create({
    data: {
      taskCode: "TSK-102",
      title: "Prepare Custom Quotation for Mehra Manufacturing",
      description: "Calculate license tiers, server specs, and implementation hours for 250 users.",
      assignedToId: rahulEmp.id,
      createdById: managerEmp.id,
      priority: "URGENT",
      dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000),
      estimatedHours: 4,
      actualHours: 3.5,
      status: "COMPLETED",
      completedDate: new Date(),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      taskCode: "TSK-103",
      title: "Weekly Lead Pipeline Audit & Sync",
      description: "Review all high-priority leads with pending follow-ups and update next steps.",
      assignedToId: amitEmp.id,
      createdById: managerEmp.id,
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      estimatedHours: 5,
      actualHours: 2,
      status: "IN_PROGRESS",
    },
  });

  const task4 = await prisma.task.create({
    data: {
      taskCode: "TSK-104",
      title: "Set up Multi-factor Security and RBAC audit",
      description: "Verify that sensitive employee salary data is only visible to HR and Admin roles.",
      assignedToId: rahulEmp.id,
      createdById: adminEmp.id,
      priority: "HIGH",
      dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
      estimatedHours: 8,
      actualHours: 8,
      status: "COMPLETED",
      completedDate: new Date(),
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: "New High-Value Deal Closed",
        message: "Rahul Verma closed ORD-2026-001 (₹2,65,000) with JDS Global Logistics.",
        link: "/sales",
        type: "SUCCESS",
      },
      {
        userId: rahulUser.id,
        title: "Follow-up Scheduled for Tomorrow",
        message: "You have a high-priority follow-up demo with Deepak Mehra (Mehra Mfg) at 3:00 PM.",
        link: "/crm",
        type: "WARNING",
      },
      {
        userId: managerUser.id,
        title: "Team Attendance Summary",
        message: "All 3 team members checked in on time today.",
        link: "/attendance",
        type: "INFO",
      },
    ],
  });

  // Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        userName: "Sarvesh Bhoite(Admin)",
        action: "INITIALIZE_SYSTEM",
        module: "SETTINGS",
        details: "ERP Enterprise configuration initialized with 4 departments and 5 designations.",
      },
      {
        userId: rahulUser.id,
        userName: "Rahul Verma",
        action: "CONVERT_LEAD",
        module: "CRM",
        recordId: "LEAD-101",
        details: "Converted lead LEAD-101 to Customer JDS Logistics and generated Order ORD-2026-001.",
      },
      {
        userId: managerUser.id,
        userName: "Priya Sharma",
        action: "CREATE_TASK",
        module: "TASKS",
        recordId: "TSK-101",
        details: "Assigned high-priority onboarding task to Rahul Verma.",
      },
    ],
  });

  console.log("ERP Database Seeded Successfully!");
  console.log("Admin login: admin@erp.com / admin123");
  console.log("Manager login: priya@erp.com / password123");
  console.log("Employee login: rahul@erp.com / password123");
  console.log("Employee login: amit@erp.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
