"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getLeads(filters?: {
  status?: string;
  search?: string;
  assignedToId?: string;
  startDate?: string;
  endDate?: string;
  externalSource?: string;
  isImportedToPipeline?: boolean;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentUserRole = (session.user as any).role;
  const currentEmpId = (session.user as any).employeeId;
  let currentDeptId = (session.user as any).departmentId;

  const where: any = {};
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }
  if (filters?.assignedToId && filters.assignedToId !== "ALL") {
    where.assignedToId = filters.assignedToId;
  }

  // Date Range Filtering (createdAt between startDate and endDate)
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      where.createdAt.gte = start;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (filters?.externalSource && filters.externalSource !== "ALL") {
    if (filters.externalSource === "MANUAL") {
      where.externalSource = null;
    } else {
      where.externalSource = filters.externalSource;
    }
  }

  if (typeof filters?.isImportedToPipeline === "boolean") {
    where.isImportedToPipeline = filters.isImportedToPipeline;
  }

  if (filters?.search) {
    where.OR = [
      { customerName: { contains: filters.search, mode: "insensitive" } },
      { leadCode: { contains: filters.search, mode: "insensitive" } },
      { company: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { location: { contains: filters.search, mode: "insensitive" } },
      { productInterest: { contains: filters.search, mode: "insensitive" } },
      { aiSummary: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // 1. Employee role sees only their own assigned leads (except when browsing external discovery leads)
  if (currentUserRole === "EMPLOYEE" && currentEmpId && filters?.isImportedToPipeline !== false) {
    where.assignedToId = currentEmpId;
  } else if (currentUserRole === "MANAGER" && filters?.isImportedToPipeline !== false) {
    // 2. Manager sees leads belonging to employees in their department + their own leads
    if (!currentDeptId && session.user.id) {
      const dbEmp = await prisma.employee.findUnique({
        where: { userId: session.user.id },
        select: { departmentId: true },
      });
      currentDeptId = dbEmp?.departmentId;
    }

    if (currentDeptId) {
      where.OR = [
        { assignedTo: { departmentId: currentDeptId } },
        { assignedToId: currentEmpId },
      ];
    }
  }

  const limit = filters?.limit ? Number(filters.limit) : undefined;
  const page = filters?.page ? Number(filters.page) : 1;
  const skip = limit ? (page - 1) * limit : undefined;

  return await prisma.lead.findMany({
    where,
    include: {
      assignedTo: { include: { user: true } },
      followUps: true,
      customer: true,
    },
    orderBy: { createdAt: "desc" },
    ...(skip !== undefined ? { skip } : {}),
    ...(limit !== undefined ? { take: limit } : {}),
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
  priority?: string;
  notes?: string;
  followUpDate?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentEmpId = (session.user as any).employeeId;
  const currentUserRole = (session.user as any).role;

  // Auto-assign to logged-in user if employee or manager creating their own lead, unless admin assigned someone else
  let finalAssignedToId = data.assignedToId;
  if (!finalAssignedToId || currentUserRole === "EMPLOYEE" || (currentUserRole === "MANAGER" && !data.assignedToId)) {
    finalAssignedToId = currentEmpId || null;
  }

  const leadCount = await prisma.lead.count();
  const leadCode = `LEAD-${100 + leadCount + 1}`;

  const lead = await prisma.lead.create({
    data: {
      leadCode,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || null,
      company: data.company || null,
      location: data.location || null,
      source: data.source || "CALLING",
      productInterest: data.productInterest || null,
      expectedValue: Number(data.expectedValue) || 0,
      assignedToId: finalAssignedToId,
      priority: data.priority || "MEDIUM",
      notes: data.notes || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      isImportedToPipeline: true,
      status: "NEW",
    },
    include: {
      assignedTo: { include: { user: true } },
      customer: true,
      followUps: true,
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

export async function updateLeadDetails(
  id: string,
  data: {
    customerName?: string;
    phone?: string;
    email?: string;
    company?: string;
    location?: string;
    source?: string;
    productInterest?: string;
    expectedValue?: number;
    priority?: string;
    notes?: string;
    assignedToId?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const updateData: any = {};
  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.company !== undefined) updateData.company = data.company || null;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.source !== undefined) updateData.source = data.source;
  if (data.productInterest !== undefined) updateData.productInterest = data.productInterest || null;
  if (data.expectedValue !== undefined) updateData.expectedValue = Number(data.expectedValue) || 0;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.assignedToId !== undefined && (session.user as any).role === "ADMIN") {
    updateData.assignedToId = data.assignedToId || null;
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: updateData,
    include: {
      assignedTo: { include: { user: true } },
      customer: true,
      followUps: true,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      type: "EDIT_LEAD",
      note: `Lead parameters updated by ${session.user.name}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "EDIT_LEAD",
      module: "CRM",
      recordId: updatedLead.leadCode,
      details: `Updated details for lead ${updatedLead.leadCode} (${updatedLead.customerName})`,
    },
  });

  revalidatePath("/crm");
  revalidatePath("/dashboard");
  return updatedLead;
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
    include: {
      assignedTo: { include: { user: true } },
      customer: true,
      followUps: true,
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


export async function convertLeadToCustomerAndOrder(
  leadId: string,
  orderData: {
    totalAmount: number;
    itemTitle: string;
    departmentType?: "DIGITAL_MARKETING" | "TECHNICAL";
    billingType?: "MONTHLY" | "ONE_TIME";
    serviceDetails?: string;
  }
) {
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

  const deptType = orderData.departmentType || (lead.departmentType as any) || "DIGITAL_MARKETING";
  const billType = orderData.billingType || (lead.billingType as any) || "MONTHLY";

  // Create Client in Clients Module
  const clientCount = await prisma.client.count();
  const clientCode = `CLT-${new Date().getFullYear()}-${String(clientCount + 1).padStart(3, "0")}`;

  const client = await prisma.client.create({
    data: {
      clientCode,
      name: lead.company || lead.customerName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      address: lead.location,
      departmentType: deptType,
      billingType: billType,
      amount: orderData.totalAmount,
      leadId: lead.id,
      customerId,
      notes: orderData.serviceDetails || lead.notes,
      createdById: lead.assignedToId || (session.user as any).employeeId || null,
      assignments: lead.assignedToId
        ? {
            create: {
              employeeId: lead.assignedToId,
              role: "MEMBER",
            },
          }
        : undefined,
      services: {
        create: {
          serviceName: orderData.itemTitle || lead.productInterest || (deptType === "DIGITAL_MARKETING" ? "Social Media & Meta Ads" : "Web / App Development"),
          category: deptType === "DIGITAL_MARKETING" ? "MARKETING" : "DEVELOPMENT",
          billingCycle: billType,
          targetCount: deptType === "DIGITAL_MARKETING" ? 15 : 1,
          completedCount: 0,
          milestoneAmount: billType === "ONE_TIME" ? orderData.totalAmount : 0,
        },
      },
    },
  });

  const orderCount = await prisma.order.count();
  const orderCode = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`;

  const order = await prisma.order.create({
    data: {
      orderCode,
      customerId,
      clientId: client.id,
      employeeId: lead.assignedToId || (session.user as any).employeeId,
      leadId: lead.id,
      totalAmount: orderData.totalAmount,
      discount: 0,
      tax: orderData.totalAmount * 0.18,
      paymentStatus: "PAID",
      notes: `Converted from lead ${lead.leadCode} -> Onboarded as Client ${client.clientCode}`,
      orderItems: {
        create: {
          itemTitle: orderData.itemTitle || lead.productInterest || "Client Contract",
          quantity: 1,
          unitPrice: orderData.totalAmount,
          total: orderData.totalAmount,
        },
      },
      invoices: {
        create: {
          invoiceCode: `INV-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`,
          dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
          totalAmount: orderData.totalAmount * 1.18,
          paymentStatus: "PAID",
        },
      },
      payments: {
        create: {
          paymentCode: `PAY-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, "0")}`,
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
      departmentType: deptType,
      billingType: billType,
      serviceDetails: orderData.serviceDetails || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "CONVERT_LEAD_TO_CLIENT",
      module: "CRM",
      recordId: lead.leadCode,
      details: `Converted lead ${lead.leadCode} to Client ${client.clientCode} and generated Order ${orderCode}`,
    },
  });

  revalidatePath("/crm");
  revalidatePath("/sales");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: true, orderCode, clientCode: client.clientCode, clientId: client.id };
}

export async function requestLeadConversionApproval(
  leadId: string,
  conversionPlan: {
    totalAmount: number;
    itemTitle: string;
    departmentType?: "DIGITAL_MARKETING" | "TECHNICAL";
    billingType?: "MONTHLY" | "ONE_TIME";
    serviceDetails?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const planNote = `[CONVERSION REQUEST]: Target Amount: ₹${conversionPlan.totalAmount} | Package: ${conversionPlan.itemTitle} | Dept: ${conversionPlan.departmentType} | Billing: ${conversionPlan.billingType}. Note: ${conversionPlan.serviceDetails || "Ready to close"}`;

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "PENDING_APPROVAL",
      departmentType: conversionPlan.departmentType || "DIGITAL_MARKETING",
      billingType: conversionPlan.billingType || "MONTHLY",
      expectedValue: Number(conversionPlan.totalAmount) || 0,
      serviceDetails: planNote,
      notes: conversionPlan.serviceDetails,
    },
    include: {
      assignedTo: { include: { user: true } },
      customer: true,
      followUps: true,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId,
      type: "CONVERSION_REQUEST",
      note: `Employee ${session.user.name || "Sales Rep"} submitted lead for Manager Approval: ${planNote}`,
    },
  });

  revalidatePath("/crm");
  revalidatePath("/dashboard");
  return updated;
}

/**
 * Transfer / Import an external scraped lead (Google Maps or CRM AI) into the active ERP Sales Pipeline
 */
export async function importExternalLeadToPipeline(leadId: string, assignedToId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentEmpId = (session.user as any).employeeId;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      isImportedToPipeline: true,
      status: "NEW", // enters as fresh active pipeline lead
      assignedToId: assignedToId || lead.assignedToId || currentEmpId || null,
    },
    include: {
      assignedTo: { include: { user: true } },
      customer: true,
      followUps: true,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId,
      type: "TRANSFERRED_TO_PIPELINE",
      note: `Transferred by ${session.user.name || "Sales Rep"} from External Discovery Inbox to Active ERP Pipeline.`,
    },
  });

  revalidatePath("/crm");
  revalidatePath("/dashboard");
  return updated;
}

/**
 * Update discovery status or notes for an external lead while still in the Discovery Inbox
 */
export async function updateExternalLeadNotes(leadId: string, notes: string, status?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      notes,
      ...(status ? { status } : {}),
    },
  });

  revalidatePath("/crm");
  return updated;
}

