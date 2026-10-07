"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// -------------------------------------------------------------
// CLIENTS & PROJECTS MANAGEMENT
// -------------------------------------------------------------

export async function getClients(filters?: { departmentType?: string; status?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  const currentEmpId = (session.user as any).employeeId;
  const currentDeptName = (session.user as any).department || "";

  const where: any = {};

  if (filters?.departmentType && filters.departmentType !== "ALL") {
    where.departmentType = filters.departmentType;
  }
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  // Role Scoping:
  // 1. Manager: Only sees clients in their dedicated department
  if (userRole === "MANAGER") {
    if (currentDeptName.toLowerCase().includes("marketing")) {
      where.departmentType = "DIGITAL_MARKETING";
    } else if (currentDeptName.toLowerCase().includes("tech") || currentDeptName.toLowerCase().includes("engineering")) {
      where.departmentType = "TECHNICAL";
    }
  }

  // 2. Employee: Only sees clients explicitly assigned to them
  if (userRole === "EMPLOYEE") {
    if (!currentEmpId) return [];
    where.assignments = {
      some: { employeeId: currentEmpId },
    };
  }

  // 3. Admin: Full company visibility across all departments

  return await prisma.client.findMany({
    where,
    include: {
      lead: true,
      customer: true,
      createdBy: { include: { user: true } },
      assignments: {
        include: {
          employee: {
            include: { user: true, department: true, designation: true },
          },
        },
      },
      services: {
        include: {
          metrics: { orderBy: { orderIndex: "asc" } },
          logs: {
            include: { employee: { include: { user: true } } },
            orderBy: { loggedAt: "desc" },
            take: 5,
          },
        },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      orders: {
        orderBy: { saleDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  departmentType: "DIGITAL_MARKETING" | "TECHNICAL";
  billingType: "MONTHLY" | "ONE_TIME";
  amount: number;
  notes?: string;
  leadId?: string;
  assignedEmployeeIds?: string[];
  initialServices?: {
    serviceName: string;
    category?: string;
    target?: string | number;
    targetCount?: number;
    billingCycle?: string;
    milestoneAmount?: number;
    notes?: string;
  }[];
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentEmpId = (session.user as any).employeeId;
  const count = await prisma.client.count();
  const clientCode = `CLT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  // If customer doesn't exist, create customer
  let customerId: string | null = null;
  if (data.leadId) {
    const existingLead = await prisma.lead.findUnique({
      where: { id: data.leadId },
      include: { customer: true },
    });
    if (existingLead?.customerId) {
      customerId = existingLead.customerId;
    } else if (existingLead) {
      const newCust = await prisma.customer.create({
        data: {
          name: data.name,
          email: data.email || `${existingLead.leadCode.toLowerCase()}@customer.com`,
          phone: data.phone || existingLead.phone,
          company: data.company || existingLead.company || null,
          address: data.address || existingLead.location || null,
        },
      });
      customerId = newCust.id;
    }
  } else {
    const custEmail = data.email || `client-${clientCode.toLowerCase()}@client.com`;
    const newCust = await prisma.customer.create({
      data: {
        name: data.name,
        email: custEmail,
        phone: data.phone || null,
        company: data.company || null,
        address: data.address || null,
      },
    });
    customerId = newCust.id;
  }

  const client = await prisma.client.create({
    data: {
      clientCode,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      departmentType: data.departmentType,
      billingType: data.billingType,
      amount: Number(data.amount) || 0,
      notes: data.notes || null,
      leadId: data.leadId || null,
      customerId,
      createdById: currentEmpId || null,
      assignments: data.assignedEmployeeIds && data.assignedEmployeeIds.length > 0
        ? {
            create: data.assignedEmployeeIds.map((empId) => ({
              employeeId: empId,
              role: "MEMBER",
            })),
          }
        : undefined,
      services: data.initialServices && data.initialServices.length > 0
        ? {
            create: data.initialServices.map((srv) => {
              const rawTarget = srv.target !== undefined ? String(srv.target).trim() : (srv.targetCount !== undefined ? String(srv.targetCount) : "");
              const parsedNum = parseInt(rawTarget, 10);
              const numericCount = !isNaN(parsedNum) ? parsedNum : (srv.targetCount || 0);

              // If user provided a descriptive text target that isn't just pure digits (e.g. "15 Reels", "Full Build"), note it down
              let targetNote = srv.notes || "";
              if (rawTarget && isNaN(Number(rawTarget))) {
                targetNote = targetNote ? `[Target: ${rawTarget}] ${targetNote}` : `[Target: ${rawTarget}]`;
              }

              return {
                serviceName: srv.serviceName,
                category: srv.category || (data.departmentType === "TECHNICAL" ? "DEVELOPMENT" : "MARKETING"),
                targetCount: numericCount,
                billingCycle: srv.billingCycle || data.billingType,
                milestoneAmount: Number(srv.milestoneAmount) || 0,
                notes: targetNote || null,
              };
            }),
          }
        : undefined,
    },
    include: {
      assignments: true,
      services: true,
      customer: true,
    },
  });

  // Create Corresponding Sales Order
  const orderCount = await prisma.order.count();
  const orderCode = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`;
  const totalAmt = Number(data.amount) || 0;

  await prisma.order.create({
    data: {
      orderCode,
      customerId,
      clientId: client.id,
      employeeId: currentEmpId || null,
      leadId: data.leadId || null,
      totalAmount: totalAmt,
      discount: 0,
      tax: totalAmt * 0.18,
      paymentStatus: "PAID",
      notes: `Onboarded as Client ${client.clientCode} (${data.departmentType})`,
      orderItems: {
        create: {
          itemTitle: data.initialServices?.[0]?.serviceName || `${data.departmentType} Retainer`,
          quantity: 1,
          unitPrice: totalAmt,
          total: totalAmt,
        },
      },
      invoices: {
        create: {
          invoiceCode: `INV-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`,
          dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
          totalAmount: totalAmt * 1.18,
          paymentStatus: "PAID",
        },
      },
      payments: {
        create: {
          paymentCode: `PAY-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`,
          amount: totalAmt * 1.18,
          paymentMethod: "Bank Transfer",
          paymentStatus: "PAID",
        },
      },
    },
  });

  // If created from a Lead, update lead status to CONVERTED
  if (data.leadId) {
    await prisma.lead.update({
      where: { id: data.leadId },
      data: {
        status: "CONVERTED",
        customerId,
        departmentType: data.departmentType,
        billingType: data.billingType,
      },
    });
  }

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "Manager",
      action: "CREATE_CLIENT",
      module: "CLIENTS",
      recordId: client.clientCode,
      details: `Onboarded client ${client.name} (${client.departmentType}) with ${data.initialServices?.length || 0} deliverable services`,
    },
  });

  revalidatePath("/reports");
  revalidatePath("/crm");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return client;
}

export async function assignEmployeesToClient(clientId: string, employeeIds: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Remove previous assignments and set new ones
  await prisma.clientAssignment.deleteMany({
    where: { clientId },
  });

  if (employeeIds.length > 0) {
    await prisma.clientAssignment.createMany({
      data: employeeIds.map((empId) => ({
        clientId,
        employeeId: empId,
        role: "MEMBER",
      })),
    });
  }

  revalidatePath("/reports");
  return { success: true };
}

export async function addServiceToClient(data: {
  clientId: string;
  serviceName: string;
  category: string;
  targetCount: number;
  billingCycle: string;
  milestoneAmount?: number;
  notes?: string;
  initialColumns?: { columnName: string; columnType: string; value: string }[];
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const service = await prisma.clientService.create({
    data: {
      clientId: data.clientId,
      serviceName: data.serviceName,
      category: data.category,
      targetCount: Number(data.targetCount) || 0,
      billingCycle: data.billingCycle || "MONTHLY",
      milestoneAmount: Number(data.milestoneAmount) || 0,
      notes: data.notes || null,
      metrics: data.initialColumns && data.initialColumns.length > 0
        ? {
            create: data.initialColumns.map((col, idx) => ({
              columnName: col.columnName,
              columnType: col.columnType || "TEXT",
              value: col.value || "",
              orderIndex: idx,
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/reports");
  return service;
}

export async function updateServiceProgress(data: {
  serviceId: string;
  deltaCount?: number;
  newCompletedCount?: number;
  description?: string;
  markCompleted?: boolean;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentEmpId = (session.user as any).employeeId;

  const service = await prisma.clientService.findUnique({
    where: { id: data.serviceId },
    include: { client: true },
  });
  if (!service) throw new Error("Service not found");

  const updatedCompleted = data.newCompletedCount !== undefined
    ? Number(data.newCompletedCount)
    : service.completedCount + (Number(data.deltaCount) || 1);

  const isCompleted = data.markCompleted || (service.targetCount > 0 && updatedCompleted >= service.targetCount);

  const updatedService = await prisma.clientService.update({
    where: { id: data.serviceId },
    data: {
      completedCount: updatedCompleted,
      status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
    },
  });

  // Log deliverable
  if (currentEmpId) {
    await prisma.deliverableLog.create({
      data: {
        serviceId: data.serviceId,
        employeeId: currentEmpId,
        deltaCount: Number(data.deltaCount) || 1,
        description: data.description || `Updated deliverable progress to ${updatedCompleted}`,
      },
    });
  }

  // Automatic Receivable generation upon completion or monthly cycle close
  if (isCompleted && (service.milestoneAmount > 0 || service.client.amount > 0)) {
    const receivableAmount = service.milestoneAmount > 0 ? service.milestoneAmount : service.client.amount;
    const orderCount = await prisma.order.count();
    const orderCode = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`;

    await prisma.order.create({
      data: {
        orderCode,
        clientId: service.clientId,
        customerId: service.client.customerId || null,
        totalAmount: receivableAmount,
        paymentStatus: "PENDING", // Marked as receivable ready for sales collection
        notes: `Auto-generated Receivable for completed service: ${service.serviceName} (${service.client.name})`,
        orderItems: {
          create: {
            itemTitle: `${service.serviceName} - ${service.client.name}`,
            quantity: 1,
            unitPrice: receivableAmount,
            total: receivableAmount,
          },
        },
        invoices: {
          create: {
            invoiceCode: `INV-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`,
            dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
            totalAmount: receivableAmount,
            paymentStatus: "PENDING",
          },
        },
      },
    });
  }

  revalidatePath("/reports");
  revalidatePath("/sales");
  return updatedService;
}

export async function saveClientProgressSheet(data: {
  clientId: string;
  month: number;
  year: number;
  columnsJson: string; // Dynamic columns definition & row records
  notes?: string;
  status?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userName = session.user.name || "Employee";

  const existing = await prisma.clientReport.findFirst({
    where: {
      clientId: data.clientId,
      month: data.month,
      year: data.year,
    },
  });

  let report;
  if (existing) {
    report = await prisma.clientReport.update({
      where: { id: existing.id },
      data: {
        columnsJson: data.columnsJson,
        notes: data.notes || existing.notes,
        status: data.status || existing.status,
        submittedBy: userName,
      },
    });
  } else {
    report = await prisma.clientReport.create({
      data: {
        clientId: data.clientId,
        month: data.month,
        year: data.year,
        columnsJson: data.columnsJson,
        notes: data.notes || null,
        status: data.status || "IN_PROGRESS",
        submittedBy: userName,
      },
    });
  }

  revalidatePath("/reports");
  return report;
}

export async function completeClientProgressReport(data: {
  reportId?: string;
  clientId: string;
  month: number;
  year: number;
  columnsJson?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userName = session.user.name || "Manager";

  const client = await prisma.client.findUnique({
    where: { id: data.clientId },
    include: { customer: true },
  });
  if (!client) throw new Error("Client not found");

  // Upsert or update the ClientReport status to COMPLETED
  let report: any;
  if (data.reportId) {
    report = await prisma.clientReport.update({
      where: { id: data.reportId },
      data: {
        status: "COMPLETED",
        submittedBy: userName,
        notes: data.notes || undefined,
        ...(data.columnsJson ? { columnsJson: data.columnsJson } : {}),
      },
    });
  } else {
    const existing = await prisma.clientReport.findFirst({
      where: {
        clientId: data.clientId,
        month: data.month,
        year: data.year,
      },
    });

    if (existing) {
      report = await prisma.clientReport.update({
        where: { id: existing.id },
        data: {
          status: "COMPLETED",
          submittedBy: userName,
          notes: data.notes || existing.notes,
          ...(data.columnsJson ? { columnsJson: data.columnsJson } : {}),
        },
      });
    } else {
      report = await prisma.clientReport.create({
        data: {
          clientId: data.clientId,
          month: data.month,
          year: data.year,
          columnsJson: data.columnsJson || JSON.stringify({ columns: [], rows: [] }),
          notes: data.notes || `Progress report completed for ${data.month}/${data.year}`,
          status: "COMPLETED",
          submittedBy: userName,
        },
      });
    }
  }

  // Update client status if ONE_TIME to COMPLETED
  if (client.billingType === "ONE_TIME") {
    await prisma.client.update({
      where: { id: client.id },
      data: { status: "COMPLETED" },
    });
  }

  // Create Receivable Order for Sales Ledger
  const amount = client.amount || 0;
  let customerId = client.customerId;
  if (!customerId) {
    const cust = await prisma.customer.create({
      data: {
        name: client.name,
        company: client.company || client.name,
        email: client.email || `${client.clientCode.toLowerCase()}@client.com`,
        phone: client.phone || "9999999999",
        address: client.address || "",
      },
    });
    customerId = cust.id;
    await prisma.client.update({
      where: { id: client.id },
      data: { customerId: cust.id },
    });
  }

  const orderCount = await prisma.order.count();
  const orderCode = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`;

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const cycleLabel = client.billingType === "MONTHLY"
    ? `Monthly Retainer Deliverable (${monthNames[data.month - 1] || data.month} ${data.year})`
    : `One-Time Project Delivery Scope`;

  const order = await prisma.order.create({
    data: {
      orderCode,
      customerId,
      clientId: client.id,
      totalAmount: amount,
      paymentStatus: "PENDING",
      notes: `[AUTO RECEIVABLE from Progress Report Completed]: ${cycleLabel} for ${client.name}. Amount: ₹${amount}.`,
      orderItems: {
        create: {
          itemTitle: `${client.name} - ${cycleLabel}`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
        },
      },
      invoices: {
        create: {
          invoiceCode: `INV-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`,
          dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          totalAmount: amount,
          paymentStatus: "PENDING",
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: userName,
      action: "PROGRESS_REPORT_COMPLETED",
      module: "CLIENT_REPORTS",
      recordId: client.clientCode,
      details: `Marked Progress Report completed for ${client.name} (${cycleLabel}). Receivable ₹${amount} automatically forwarded to Sales for collection.`,
    },
  });

  revalidatePath("/reports");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { report, order };
}

// EXPENSES & FINANCIAL TRACKING
// -------------------------------------------------------------

export async function getCompanyFinancialSummary(month?: number, year?: number) {
  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();

  const [orders, employees, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        saleDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lte: new Date(currentYear, currentMonth, 0, 23, 59, 59),
        },
      },
      include: { client: true },
    }),
    prisma.employee.findMany({
      where: { employmentStatus: "ACTIVE" },
      select: { salary: true },
    }),
    prisma.expense.findMany({
      where: { month: currentMonth, year: currentYear },
    }),
  ]);

  const totalSalesRevenue = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalReceivables = orders
    .filter((o) => o.paymentStatus !== "PAID")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalPayrollSalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOutflow = totalPayrollSalaries + totalExpenses;
  const netFundBuffer = totalSalesRevenue - totalOutflow;

  return {
    month: currentMonth,
    year: currentYear,
    totalSalesRevenue,
    totalReceivables,
    totalPayrollSalaries,
    totalExpenses,
    totalOutflow,
    netFundBuffer,
    ordersCount: orders.length,
    expensesList: expenses,
  };
}

export async function addExpense(data: {
  category: string;
  title: string;
  amount: number;
  date?: string;
  paidTo?: string;
  paymentMode?: string;
  notes?: string;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN" && (session?.user as any)?.role !== "MANAGER") {
    throw new Error("Manager or Admin access required to add expenses");
  }

  const expDate = data.date ? new Date(data.date) : new Date();
  const count = await prisma.expense.count();
  const expenseCode = `EXP-${expDate.getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  const expense = await prisma.expense.create({
    data: {
      expenseCode,
      category: data.category,
      title: data.title,
      amount: Number(data.amount) || 0,
      date: expDate,
      month: expDate.getMonth() + 1,
      year: expDate.getFullYear(),
      paidTo: data.paidTo || null,
      paymentMode: data.paymentMode || "BANK_TRANSFER",
      notes: data.notes || null,
    },
  });

  revalidatePath("/sales");
  return expense;
}

// -------------------------------------------------------------
// PERFORMANCE RATINGS (GREEN / YELLOW / RED)
// -------------------------------------------------------------

export async function rateEmployeePerformance(data: {
  employeeId: string;
  month: number;
  year: number;
  rating: "GREEN" | "YELLOW" | "RED";
  tasksScore?: number;
  attendanceScore?: number;
  feedback?: string;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN" && (session?.user as any)?.role !== "MANAGER") {
    throw new Error("Unauthorized to rate employees");
  }

  const raterName = session?.user?.name || "Manager";

  const ratingRecord = await prisma.performanceRating.upsert({
    where: {
      employeeId_month_year: {
        employeeId: data.employeeId,
        month: data.month,
        year: data.year,
      },
    },
    update: {
      rating: data.rating,
      tasksScore: data.tasksScore ?? 100,
      attendanceScore: data.attendanceScore ?? 100,
      feedback: data.feedback || null,
      ratedBy: raterName,
    },
    create: {
      employeeId: data.employeeId,
      month: data.month,
      year: data.year,
      rating: data.rating,
      tasksScore: data.tasksScore ?? 100,
      attendanceScore: data.attendanceScore ?? 100,
      feedback: data.feedback || null,
      ratedBy: raterName,
    },
  });

  revalidatePath("/employees");
  return ratingRecord;
}

export async function forwardClientDeliverableToSales(
  clientId: string,
  data: { amount?: number; notes?: string; deliverableSummary?: string }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { customer: true },
  });
  if (!client) throw new Error("Client not found");

  // Ensure Customer record exists
  let customerId = client.customerId;
  if (!customerId) {
    const cust = await prisma.customer.create({
      data: {
        name: client.name,
        company: client.company,
        email: client.email || `${client.clientCode.toLowerCase()}@client.com`,
        phone: client.phone || "N/A",
        address: client.address,
      },
    });
    customerId = cust.id;
    await prisma.client.update({
      where: { id: clientId },
      data: { customerId: cust.id },
    });
  }

  const orderCount = await prisma.order.count();
  const orderCode = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`;
  const amount = Number(data.amount) || client.amount || 50000;
  const noteContent =
    data.notes ||
    `[FORWARDED FROM ${client.departmentType}]: Deliverable completed for ${client.name}. Collect ₹${amount}. Summary: ${data.deliverableSummary || "Deliverables delivered"}`;

  const order = await prisma.order.create({
    data: {
      orderCode,
      customerId,
      clientId: client.id,
      totalAmount: amount,
      paymentStatus: "PENDING",
      notes: noteContent,
      orderItems: {
        create: {
          itemTitle: `${client.name} - ${client.departmentType === "DIGITAL_MARKETING" ? "Marketing Campaign Deliverables" : "Development Milestone Delivery"}`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
        },
      },
      invoices: {
        create: {
          invoiceCode: `INV-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`,
          dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          totalAmount: amount,
          paymentStatus: "PENDING",
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "Manager",
      action: "FORWARD_TO_SALES",
      module: "CLIENTS",
      recordId: client.clientCode,
      details: `Forwarded client ${client.name} deliverables to Sales for payment collection (Amount: ₹${amount})`,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return order;
}

export async function createClientSprintTask(data: {
  clientId: string;
  clientName: string;
  title: string;
  description?: string;
  assignedToId: string;
  priority?: string;
  dueDate: string;
  estimatedHours?: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const totalTasks = await prisma.task.count();
  const taskCode = `TSK-${String(totalTasks + 1).padStart(4, "0")}`;

  const task = await prisma.task.create({
    data: {
      taskCode,
      title: `[${data.clientName}] ${data.title}`,
      description: data.description || `Task for client ${data.clientName}`,
      assignedToId: data.assignedToId,
      priority: data.priority || "MEDIUM",
      dueDate: new Date(data.dueDate),
      estimatedHours: Number(data.estimatedHours) || 4,
      status: "PENDING",
    },
    include: {
      assignedTo: { include: { user: true } },
    },
  });

  revalidatePath("/reports");
  revalidatePath("/employees");
  return task;
}

