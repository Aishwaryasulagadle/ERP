"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getSalesData(filters?: { paymentStatus?: string; search?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const where: any = {};
  if (filters?.paymentStatus && filters.paymentStatus !== "ALL") {
    where.paymentStatus = filters.paymentStatus;
  }
  if (filters?.search) {
    where.OR = [
      { orderCode: { contains: filters.search } },
      { customer: { name: { contains: filters.search } } },
      { customer: { company: { contains: filters.search } } },
      { notes: { contains: filters.search } },
    ];
  }

  // Employee role can only see their own sales
  if ((session.user as any).role === "EMPLOYEE") {
    const empId = (session.user as any).employeeId;
    if (empId) {
      where.employeeId = empId;
    }
  }

  const [orders, customers, products, quotations, invoices, payments, expenses, salesStaff, collectionTasks] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        client: true,
        employee: { include: { user: true } },
        orderItems: { include: { product: true } },
        invoices: true,
        payments: true,
      },
      orderBy: { saleDate: "desc" },
    }),
    prisma.customer.findMany({ include: { orders: true, leads: true }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany(),
    prisma.quotation.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ include: { order: { include: { customer: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ include: { order: { include: { customer: true } } }, orderBy: { paymentDate: "desc" } }),
    prisma.expense.findMany({ orderBy: { date: "desc" } }),
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
  ]);

  const totalRevenue = orders.filter((o) => o.paymentStatus === "PAID").reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingPayments = orders.filter((o) => o.paymentStatus !== "PAID").reduce((sum, o) => sum + o.totalAmount, 0);

  // Financial P&L calculation for Admin
  const allEmployees = await prisma.employee.findMany({
    where: { employmentStatus: "ACTIVE" },
    select: { salary: true },
  });
  const totalPayroll = allEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOutflow = totalPayroll + totalExpenses;
  const netProfitLoss = totalRevenue - totalOutflow;

  return {
    orders,
    customers,
    products,
    quotations,
    invoices,
    payments,
    expenses,
    salesStaff,
    collectionTasks,
    stats: {
      totalRevenue,
      pendingPayments,
      ordersCount: orders.length,
      customersCount: customers.length,
      totalPayroll,
      totalExpenses,
      totalOutflow,
      netProfitLoss,
    },
  };
}

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
    include: { customer: true, client: true },
  });
  if (!order) throw new Error("Order not found");

  const clientName = order.customer?.name || order.client?.name || "Client";
  const taskCount = await prisma.task.count();
  const taskCode = `COL-${String(taskCount + 1).padStart(4, "0")}`;

  const due = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 3 * 24 * 3600 * 1000);

  const task = await prisma.task.create({
    data: {
      taskCode,
      title: `[Collection] Follow up receivable: ${clientName} (₹${order.totalAmount})`,
      description: data.notes || `Collect pending invoice amount ₹${order.totalAmount} for order ${order.orderCode} (${clientName}).`,
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

export async function recordCustomReceivedPayment(data: {
  amount: number;
  paymentMethod: string;
  notes: string;
  customerName?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const count = await prisma.payment.count();
  const paymentCode = `PAY-CUST-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  // Find or create direct customer for custom payment
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
      notes: `Custom Payment: ${data.notes} (Logged by ${session.user.name})`,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return payment;
}

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

export async function recordCustomExpense(data: {
  category: string;
  title: string;
  amount: number;
  paidTo?: string;
  paymentMode?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if ((session.user as any).role !== "ADMIN") {
    throw new Error("Only Admin can record company operational expenses");
  }

  const count = await prisma.expense.count();
  const expenseCode = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  const expense = await prisma.expense.create({
    data: {
      expenseCode,
      category: data.category,
      title: data.title,
      amount: Number(data.amount) || 0,
      paidTo: data.paidTo || null,
      paymentMode: data.paymentMode || "BANK_TRANSFER",
      notes: data.notes || null,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return expense;
}

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

export async function markPaymentReceived(orderId: string, paymentMethod = "Bank Transfer", notes?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { invoices: true },
  });
  if (!order) throw new Error("Order not found");

  const paymentCount = await prisma.payment.count();
  const paymentCode = `PAY-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(3, "0")}`;

  await prisma.payment.create({
    data: {
      paymentCode,
      orderId: order.id,
      amount: order.totalAmount,
      paymentMethod,
      paymentStatus: "PAID",
      notes: notes || `Payment received by ${session.user.name}`,
    },
  });

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID" },
  });

  // Mark associated invoices as paid
  await prisma.invoice.updateMany({
    where: { orderId: order.id },
    data: { paymentStatus: "PAID" },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "Sales",
      action: "RECEIVE_PAYMENT",
      module: "SALES",
      recordId: order.orderCode,
      details: `Collected payment of ₹${order.totalAmount} for order ${order.orderCode}`,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return updatedOrder;
}
