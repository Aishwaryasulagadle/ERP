"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Ensure every active monthly client has a retainer order for the specified month/year.
 * This guarantees the Sales module dynamically displays monthly clients directly
 * with no manual "forward to sales" dependency needed!
 */
export async function syncMonthlyRetainerOrders(month: number, year: number) {
  const activeMonthlyClients = await prisma.client.findMany({
    where: {
      status: "ACTIVE",
      billingType: "MONTHLY",
    },
    include: {
      customer: true,
      orders: {
        where: {
          saleDate: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
        include: { payments: true },
      },
    },
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[month - 1] || `Month ${month}`;

  for (const client of activeMonthlyClients) {
    if (!client.orders || client.orders.length === 0) {
      // Create Customer record if client doesn't have one yet
      let customerId = client.customerId;
      if (!customerId) {
        const cust = await prisma.customer.create({
          data: {
            name: client.name.trim(),
            company: client.company || client.name.trim(),
            email: client.email || `${client.clientCode.toLowerCase()}@client.com`,
            phone: client.phone || "N/A",
            address: client.address,
          },
        });
        customerId = cust.id;
        await prisma.client.update({
          where: { id: client.id },
          data: { customerId: cust.id },
        });
      }

      const orderCount = await prisma.order.count();
      const orderCode = `ORD-${year}-${String(orderCount + 1).padStart(3, "0")}`;
      const amount = client.amount || 0;

      await prisma.order.create({
        data: {
          orderCode,
          customerId,
          clientId: client.id,
          totalAmount: amount,
          paymentStatus: "PENDING",
          saleDate: new Date(year, month - 1, 1),
          notes: `Monthly Retainer - ${monthName} ${year} (${client.name})`,
          orderItems: {
            create: {
              itemTitle: `Monthly Retainer Service - ${monthName} ${year}`,
              quantity: 1,
              unitPrice: amount,
              total: amount,
            },
          },
          invoices: {
            create: {
              invoiceCode: `INV-${year}-${String(orderCount + 1).padStart(3, "0")}`,
              dueDate: new Date(year, month - 1, 10),
              totalAmount: amount,
              paymentStatus: "PENDING",
            },
          },
        },
      });
    }
  }

  // Also ensure any one-time active clients have their baseline order if missing
  const activeOneTimeClients = await prisma.client.findMany({
    where: {
      status: "ACTIVE",
      billingType: "ONE_TIME",
    },
    include: {
      customer: true,
      orders: true,
    },
  });

  for (const client of activeOneTimeClients) {
    if (!client.orders || client.orders.length === 0) {
      let customerId = client.customerId;
      if (!customerId) {
        const cust = await prisma.customer.create({
          data: {
            name: client.name.trim(),
            company: client.company || client.name.trim(),
            email: client.email || `${client.clientCode.toLowerCase()}@client.com`,
            phone: client.phone || "N/A",
            address: client.address,
          },
        });
        customerId = cust.id;
        await prisma.client.update({
          where: { id: client.id },
          data: { customerId: cust.id },
        });
      }

      const orderCount = await prisma.order.count();
      const orderCode = `ORD-${year}-${String(orderCount + 1).padStart(3, "0")}`;
      const amount = client.amount || 0;

      await prisma.order.create({
        data: {
          orderCode,
          customerId,
          clientId: client.id,
          totalAmount: amount,
          paymentStatus: "PENDING",
          saleDate: client.onboardingDate || new Date(),
          notes: `One-time Project Contract: ${client.name}`,
          orderItems: {
            create: {
              itemTitle: `One-Time Project Delivery - ${client.name}`,
              quantity: 1,
              unitPrice: amount,
              total: amount,
            },
          },
          invoices: {
            create: {
              invoiceCode: `INV-${year}-${String(orderCount + 1).padStart(3, "0")}`,
              dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
              totalAmount: amount,
              paymentStatus: "PENDING",
            },
          },
        },
      });
    }
  }
}

/**
 * Main sales query action with month & year filter support.
 * Revenue is computed directly from payments collected in that month/year.
 * Solvency buffer compares collected cash against payroll salaries and operational expenses.
 */
export async function getSalesData(filters?: {
  month?: number;
  year?: number;
  paymentStatus?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const now = new Date();
  const selectedMonth = filters?.month || now.getMonth() + 1; // 1 - 12
  const selectedYear = filters?.year || now.getFullYear();

  // Auto-sync monthly clients so list is always dynamic and up to date for this month
  await syncMonthlyRetainerOrders(selectedMonth, selectedYear);

  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth, 1);

  const where: any = {};
  if (filters?.paymentStatus && filters.paymentStatus !== "ALL") {
    where.paymentStatus = filters.paymentStatus;
  }
  if (filters?.search) {
    where.OR = [
      { orderCode: { contains: filters.search } },
      { customer: { name: { contains: filters.search } } },
      { customer: { company: { contains: filters.search } } },
      { client: { name: { contains: filters.search } } },
      { notes: { contains: filters.search } },
    ];
  }

  // Employee role can only see their own sales if specified
  if ((session.user as any).role === "EMPLOYEE") {
    const empId = (session.user as any).employeeId;
    if (empId) {
      where.employeeId = empId;
    }
  }

  const [
    allOrders,
    allClients,
    customers,
    products,
    allPayments,
    monthExpenses,
    allExpenses,
    salesStaff,
    collectionTasks,
    monthSalarySlips,
    allEmployees,
  ] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        client: true,
        employee: { include: { user: true } },
        orderItems: { include: { product: true } },
        invoices: true,
        payments: { orderBy: { paymentDate: "desc" } },
      },
      orderBy: { saleDate: "desc" },
    }),
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      include: {
        customer: true,
        orders: {
          include: { payments: true },
          orderBy: { saleDate: "desc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      include: { orders: true, leads: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany(),
    prisma.payment.findMany({
      include: {
        order: {
          include: { customer: true, client: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    }),
    prisma.expense.findMany({
      where: {
        month: selectedMonth,
        year: selectedYear,
      },
      orderBy: { date: "desc" },
    }),
    prisma.expense.findMany({
      orderBy: { date: "desc" },
    }),
    prisma.employee.findMany({
      where: {
        department: { name: { contains: "sales", mode: "insensitive" } },
        employmentStatus: "ACTIVE",
      },
      include: { user: true, designation: true },
    }),
    prisma.task.findMany({
      where: {
        title: { contains: "[Collection]" },
      },
      include: {
        assignedTo: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.salarySlip.findMany({
      where: {
        month: selectedMonth,
        year: selectedYear,
      },
    }),
    prisma.employee.findMany({
      where: { employmentStatus: "ACTIVE" },
      select: { salary: true },
    }),
  ]);

  // Separate Monthly Retainer orders and One-Time project orders
  const monthlyRetainers = allOrders.filter(
    (o) =>
      o.client?.billingType === "MONTHLY" &&
      new Date(o.saleDate) >= startOfMonth &&
      new Date(o.saleDate) < endOfMonth
  );

  const oneTimeOrders = allOrders.filter(
    (o) => o.client?.billingType === "ONE_TIME" || (!o.client && !o.notes?.includes("Monthly Retainer"))
  );

  // Exact cash payments received in the selected month
  const monthPayments = allPayments.filter((p) => {
    const pDate = new Date(p.paymentDate);
    return pDate >= startOfMonth && pDate < endOfMonth;
  });

  const monthRevenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Lifetime all-time collected revenue
  const lifetimeRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Pending receivables computation
  const pendingOrders = allOrders.filter((o) => o.paymentStatus !== "PAID");
  const pendingReceivablesTotal = pendingOrders.reduce((sum, o) => {
    const paidSoFar = (o.payments || []).reduce((pSum: number, p: any) => pSum + (p.amount || 0), 0);
    return sum + Math.max(0, o.totalAmount - paidSoFar);
  }, 0);

  // Outflow calculation for selected month:
  // Use actual salary slips if generated, otherwise fallback to sum of employee active salaries
  const totalPayroll =
    monthSalarySlips.length > 0
      ? monthSalarySlips.reduce((sum, s) => sum + (s.netSalary || s.grossSalary || 0), 0)
      : allEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);

  const totalExpenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOutflow = totalPayroll + totalExpenses;
  const netProfitLoss = monthRevenue - totalOutflow;

  return {
    selectedMonth,
    selectedYear,
    orders: allOrders,
    monthlyRetainers,
    oneTimeOrders,
    clients: allClients,
    customers,
    products,
    payments: allPayments,
    monthPayments,
    expenses: monthExpenses,
    allExpenses,
    salesStaff,
    collectionTasks,
    stats: {
      monthRevenue,
      lifetimeRevenue,
      pendingReceivablesTotal,
      ordersCount: allOrders.length,
      customersCount: customers.length,
      clientsCount: allClients.length,
      totalPayroll,
      totalExpenses,
      totalOutflow,
      netProfitLoss,
    },
  };
}

/**
 * Record a payment on an order (Full or Partial).
 * Correctly attributes revenue to the month of the paymentDate.
 * Automatically updates order paymentStatus to PAID or PARTIAL.
 */
export async function recordOrderPayment(data: {
  orderId: string;
  amount: number;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { payments: true, customer: true, client: true },
  });
  if (!order) throw new Error("Order not found");

  const amountToPay = Number(data.amount);
  if (isNaN(amountToPay) || amountToPay <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const existingPaid = order.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const newTotalPaid = existingPaid + amountToPay;

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

  // Create payment record
  const paymentCode = `PAY-${paymentDate.getFullYear()}-${Date.now().toString().slice(-4)}`;
  const payment = await prisma.payment.create({
    data: {
      paymentCode,
      orderId: order.id,
      amount: amountToPay,
      paymentMethod: data.paymentMethod || "Bank Transfer",
      paymentStatus: "PAID",
      paymentDate,
      notes: data.notes || `Collected by ${session.user.name || "Sales"}`,
    },
  });

  // Calculate new status
  const newStatus = newTotalPaid >= order.totalAmount ? "PAID" : "PARTIAL";

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: newStatus },
  });

  // Update associated invoice status
  await prisma.invoice.updateMany({
    where: { orderId: order.id },
    data: { paymentStatus: newStatus },
  });

  // If order was tied to a collection task, mark it completed
  const clientName = order.customer?.name || order.client?.name || "";
  if (newStatus === "PAID" && clientName) {
    await prisma.task.updateMany({
      where: {
        title: { contains: clientName },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      data: {
        status: "COMPLETED",
        completedDate: new Date(),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "Sales",
      action: "RECORD_PAYMENT",
      module: "SALES",
      recordId: order.orderCode,
      details: `Recorded payment of ₹${amountToPay} (${newStatus}) for order ${order.orderCode} (${clientName})`,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return payment;
}

/**
 * Record a direct custom payment / settlement voucher.
 */
export async function recordCustomReceivedPayment(data: {
  amount: number;
  paymentMethod: string;
  notes: string;
  customerName?: string;
  paymentDate?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
  const paymentCode = `PAY-CUST-${paymentDate.getFullYear()}-${Date.now().toString().slice(-4)}`;

  let customer = await prisma.customer.findFirst({
    where: { name: data.customerName || "Direct Receipt" },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: data.customerName || "Direct Receipt",
        email: "accounts@jisnu.com",
      },
    });
  }

  const orderCount = await prisma.order.count();
  const order = await prisma.order.create({
    data: {
      orderCode: `ORD-CUST-${String(orderCount + 1).padStart(3, "0")}`,
      customerId: customer.id,
      employeeId: (session.user as any).employeeId || null,
      totalAmount: Number(data.amount) || 0,
      tax: 0,
      paymentStatus: "PAID",
      saleDate: paymentDate,
      notes: data.notes,
      orderItems: {
        create: {
          itemTitle: "Custom Direct Payment / Settlement",
          quantity: 1,
          unitPrice: Number(data.amount) || 0,
          total: Number(data.amount) || 0,
        },
      },
    },
  });

  const payment = await prisma.payment.create({
    data: {
      paymentCode,
      orderId: order.id,
      amount: Number(data.amount) || 0,
      paymentMethod: data.paymentMethod || "Bank Transfer",
      paymentStatus: "PAID",
      paymentDate,
      notes: `Custom Payment: ${data.notes} (Logged by ${session.user.name})`,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return payment;
}

/**
 * Record a custom receivable invoice.
 */
export async function recordCustomReceivable(data: {
  customerName: string;
  amount: number;
  itemTitle?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  let customer = await prisma.customer.findFirst({
    where: { name: data.customerName },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: data.customerName,
        email: "client@jisnu.com",
      },
    });
  }

  const orderCount = await prisma.order.count();
  const order = await prisma.order.create({
    data: {
      orderCode: `REC-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`,
      customerId: customer.id,
      employeeId: (session.user as any).employeeId || null,
      totalAmount: Number(data.amount) || 0,
      tax: 0,
      paymentStatus: "PENDING",
      notes: data.notes,
      orderItems: {
        create: {
          itemTitle: data.itemTitle || "Custom Contract Receivable",
          quantity: 1,
          unitPrice: Number(data.amount) || 0,
          total: Number(data.amount) || 0,
        },
      },
      invoices: {
        create: {
          invoiceCode: `INV-${String(orderCount + 1).padStart(3, "0")}`,
          dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
          totalAmount: Number(data.amount) || 0,
          paymentStatus: "PENDING",
        },
      },
    },
  });

  revalidatePath("/sales");
  return order;
}

/**
 * Record company operational expense (Admin only).
 * Handles office rent, light bills, internet, software, salary payouts, etc.
 */
export async function recordCustomExpense(data: {
  category: string;
  title: string;
  amount: number;
  paidTo?: string;
  paymentMode?: string;
  date?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if ((session.user as any).role !== "ADMIN") {
    throw new Error("Only Admin can record company operational expenses");
  }

  const expenseDate = data.date ? new Date(data.date) : new Date();
  const expenseCode = `EXP-${expenseDate.getFullYear()}-${Date.now().toString().slice(-4)}`;

  const expense = await prisma.expense.create({
    data: {
      expenseCode,
      category: data.category,
      title: data.title,
      amount: Number(data.amount) || 0,
      date: expenseDate,
      paidTo: data.paidTo || null,
      paymentMode: data.paymentMode || "BANK_TRANSFER",
      notes: data.notes || null,
      month: expenseDate.getMonth() + 1,
      year: expenseDate.getFullYear(),
    },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return expense;
}

/**
 * Delete an operational expense record (Admin only).
 */
export async function deleteExpense(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if ((session.user as any).role !== "ADMIN") {
    throw new Error("Only Admin can delete company expenses");
  }

  await prisma.expense.delete({
    where: { id },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Allot collection task to a sales representative.
 */
export async function assignCollectionTask(data: {
  orderId: string;
  assignedToId: string;
  dueDate?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { customer: true, client: true, payments: true },
  });
  if (!order) throw new Error("Order not found");

  const clientName = order.customer?.name || order.client?.name || "Client";
  const paidSoFar = order.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = Math.max(0, order.totalAmount - paidSoFar);

  const taskCode = `COL-${Date.now().toString().slice(-4)}`;
  const due = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 3 * 24 * 3600 * 1000);

  const task = await prisma.task.create({
    data: {
      taskCode,
      title: `[Collection] Follow up receivable: ${clientName} (₹${remaining})`,
      description:
        data.notes ||
        `Collect pending invoice balance ₹${remaining} for order ${order.orderCode} (${clientName}).`,
      assignedToId: data.assignedToId,
      createdById: (session.user as any).employeeId || null,
      priority: "HIGH",
      dueDate: due,
      status: "PENDING",
    },
  });

  revalidatePath("/sales");
  revalidatePath("/employees");
  return task;
}

/**
 * Standard Order creation.
 */
export async function createOrder(data: {
  customerId: string;
  itemTitle: string;
  unitPrice: number;
  quantity: number;
  discount?: number;
  paymentStatus: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const orderCount = await prisma.order.count();
  const orderCode = `ORD-2026-${String(orderCount + 1).padStart(3, "0")}`;
  const totalAmount = data.unitPrice * data.quantity - (Number(data.discount) || 0);

  const order = await prisma.order.create({
    data: {
      orderCode,
      customerId: data.customerId,
      employeeId: (session.user as any).employeeId || null,
      totalAmount,
      discount: Number(data.discount) || 0,
      tax: totalAmount * 0.18,
      paymentStatus: data.paymentStatus || "PENDING",
      notes: data.notes,
      orderItems: {
        create: {
          itemTitle: data.itemTitle,
          quantity: Number(data.quantity) || 1,
          unitPrice: Number(data.unitPrice),
          total: totalAmount,
        },
      },
      invoices: {
        create: {
          invoiceCode: `INV-2026-${String(orderCount + 1).padStart(3, "0")}`,
          dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
          totalAmount: totalAmount * 1.18,
          paymentStatus: data.paymentStatus || "PENDING",
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "CREATE_ORDER",
      module: "SALES",
      recordId: order.orderCode,
      details: `Generated sale order ${order.orderCode} with value ₹${totalAmount}`,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return order;
}

/**
 * Customer creation.
 */
export async function createCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      address: data.address,
    },
  });

  revalidatePath("/sales");
  return customer;
}

/**
 * Full settlement shortcut (marks entire order paid).
 */
export async function markPaymentReceived(orderId: string, paymentMethod = "Bank Transfer", notes?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });
  if (!order) throw new Error("Order not found");

  const paidSoFar = order.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = Math.max(0, order.totalAmount - paidSoFar);

  return recordOrderPayment({
    orderId,
    amount: remaining > 0 ? remaining : order.totalAmount,
    paymentMethod,
    notes,
  });
}
