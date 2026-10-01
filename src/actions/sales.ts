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

  const [orders, customers, products, quotations, invoices, payments] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        employee: { include: { user: true } },
        orderItems: { include: { product: true } },
        invoices: true,
        payments: true,
      },
      orderBy: { saleDate: "desc" },
    }),
    prisma.customer.findMany({ include: { orders: true, leads: true } }),
    prisma.product.findMany(),
    prisma.quotation.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ include: { order: { include: { customer: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ include: { order: { include: { customer: true } } }, orderBy: { paymentDate: "desc" } }),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingPayments = orders.filter((o) => o.paymentStatus !== "PAID").reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    orders,
    customers,
    products,
    quotations,
    invoices,
    payments,
    stats: {
      totalRevenue,
      pendingPayments,
      ordersCount: orders.length,
      customersCount: customers.length,
    },
  };
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
