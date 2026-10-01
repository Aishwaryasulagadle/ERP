"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getLeads(filters?: { status?: string; search?: string; assignedToId?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const where: any = {};
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }
  if (filters?.assignedToId && filters.assignedToId !== "ALL") {
    where.assignedToId = filters.assignedToId;
  }
  if (filters?.search) {
    where.OR = [
      { customerName: { contains: filters.search } },
      { leadCode: { contains: filters.search } },
      { company: { contains: filters.search } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search } },
    ];
  }

  // Employee role can only see their own assigned leads
  if ((session.user as any).role === "EMPLOYEE") {
    const empId = (session.user as any).employeeId;
    if (empId) {
      where.assignedToId = empId;
    }
  }

  return await prisma.lead.findMany({
    where,
    include: {
      assignedTo: { include: { user: true } },
      followUps: true,
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLead(data: {
  customerName: string;
  phone: string;
  email?: string;
  company?: string;
  location?: string;
  source: string;
  productInterest?: string;
  expectedValue: number;
  assignedToId?: string;
  priority: string;
  notes?: string;
  followUpDate?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const leadCount = await prisma.lead.count();
  const leadCode = `LEAD-${100 + leadCount + 1}`;

  const lead = await prisma.lead.create({
    data: {
      leadCode,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      company: data.company,
      location: data.location,
      source: data.source,
      productInterest: data.productInterest,
      expectedValue: Number(data.expectedValue) || 0,
      assignedToId: data.assignedToId || null,
      priority: data.priority,
      notes: data.notes,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      status: "NEW",
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "CREATE_LEAD",
      module: "CRM",
      recordId: lead.leadCode,
      details: `Created lead ${lead.leadCode} for ${data.customerName}`,
    },
  });

  revalidatePath("/crm");
  revalidatePath("/dashboard");
  return lead;
}

export async function updateLeadStatus(id: string, status: string, notes?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      status,
      notes: notes ? `${notes}` : undefined,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      type: `STATUS_CHANGE_TO_${status}`,
      note: `Status updated to ${status} by ${session.user.name}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "UPDATE_LEAD_STATUS",
      module: "CRM",
      recordId: lead.leadCode,
      details: `Lead ${lead.leadCode} status moved to ${status}`,
    },
  });

  revalidatePath("/crm");
  revalidatePath("/dashboard");
  return lead;
}

export async function convertLeadToCustomerAndOrder(leadId: string, orderData: { totalAmount: number; itemTitle: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { customer: true },
  });

  if (!lead) throw new Error("Lead not found");

  // Create Customer if not exists
  let customerId = lead.customerId;
  if (!customerId) {
    const newCustomer = await prisma.customer.create({
      data: {
        name: lead.customerName,
        email: lead.email || `${lead.leadCode.toLowerCase()}@customer.com`,
        phone: lead.phone,
        company: lead.company,
        address: lead.location,
      },
    });
    customerId = newCustomer.id;
  }

  const orderCount = await prisma.order.count();
  const orderCode = `ORD-2026-${String(orderCount + 1).padStart(3, "0")}`;

  const order = await prisma.order.create({
    data: {
      orderCode,
      customerId,
      employeeId: lead.assignedToId || (session.user as any).employeeId,
      leadId: lead.id,
      totalAmount: orderData.totalAmount,
      discount: 0,
      tax: orderData.totalAmount * 0.18,
      paymentStatus: "PAID",
      notes: `Converted from lead ${lead.leadCode}`,
      orderItems: {
        create: {
          itemTitle: orderData.itemTitle || lead.productInterest || "ERP Enterprise License",
          quantity: 1,
          unitPrice: orderData.totalAmount,
          total: orderData.totalAmount,
        },
      },
      invoices: {
        create: {
          invoiceCode: `INV-2026-${String(orderCount + 1).padStart(3, "0")}`,
          dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
          totalAmount: orderData.totalAmount * 1.18,
          paymentStatus: "PAID",
        },
      },
      payments: {
        create: {
          paymentCode: `PAY-2026-${String(orderCount + 1).padStart(3, "0")}`,
          amount: orderData.totalAmount * 1.18,
          paymentMethod: "Bank Transfer",
          paymentStatus: "PAID",
        },
      },
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "CONVERTED",
      customerId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "CONVERT_LEAD",
      module: "CRM",
      recordId: lead.leadCode,
      details: `Converted lead ${lead.leadCode} into Order ${orderCode}`,
    },
  });

  revalidatePath("/crm");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { success: true, orderCode };
}
