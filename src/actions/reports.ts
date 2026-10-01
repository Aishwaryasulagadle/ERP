import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function getERPReports(dateRange = "ALL") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [orders, leads, employees, attendances, tasks] = await Promise.all([
    prisma.order.findMany({
      include: {
        customer: true,
        employee: { include: { user: true } },
      },
      orderBy: { saleDate: "desc" },
    }),
    prisma.lead.findMany({
      include: {
        assignedTo: { include: { user: true } },
      },
    }),
    prisma.employee.findMany({
      include: {
        user: true,
        department: true,
        designation: true,
        leads: true,
        sales: true,
        assignedTasks: true,
        attendances: true,
      },
    }),
    prisma.attendance.findMany({
      include: {
        employee: { include: { user: true, department: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.task.findMany({
      include: {
        assignedTo: { include: { user: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  // Lead by Source breakdown
  const sourceMap: Record<string, number> = {};
  for (const l of leads) {
    sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
  }
  const leadsBySource = Object.entries(sourceMap).map(([source, count]) => ({
    source,
    count,
  }));

  // Employee Performance Matrix
  const employeePerformance = employees.map((emp) => {
    const leadsHandled = emp.leads.length;
    const leadsConverted = emp.leads.filter((l) => l.status === "CONVERTED").length;
    const salesAmount = emp.sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const tasksTotal = emp.assignedTasks.length;
    const tasksCompleted = emp.assignedTasks.filter((t) => t.status === "COMPLETED").length;
    const totalWorkingMin = emp.attendances.reduce((sum, a) => sum + a.workingHoursMin, 0);
    const hours = Math.floor(totalWorkingMin / 60);
    const mins = totalWorkingMin % 60;

    return {
      id: emp.id,
      name: emp.user.name,
      department: emp.department?.name || "General",
      designation: emp.designation?.name || "Member",
      leadsHandled,
      leadsConverted,
      conversionRate: leadsHandled > 0 ? Math.round((leadsConverted / leadsHandled) * 100) : 0,
      salesAmount,
      tasksTotal,
      tasksCompleted,
      taskCompletionRate: tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
      workingHours: `${hours}h ${mins}m`,
    };
  });

  return {
    orders,
    leads,
    leadsBySource,
    employeePerformance,
    attendances,
    tasks,
  };
}

export async function getAuditLogs() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Admin access required for audit logs");
  }

  return await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function performGlobalSearch(query: string) {
  const session = await auth();
  if (!session?.user || !query) return { employees: [], leads: [], customers: [], sales: [], tasks: [] };

  const [employees, leads, customers, sales, tasks] = await Promise.all([
    prisma.employee.findMany({
      where: {
        OR: [
          { employeeCode: { contains: query } },
          { user: { name: { contains: query } } },
          { user: { email: { contains: query } } },
        ],
      },
      include: { user: true, designation: true },
      take: 5,
    }),
    prisma.lead.findMany({
      where: {
        OR: [
          { leadCode: { contains: query } },
          { customerName: { contains: query } },
          { company: { contains: query } },
        ],
      },
      take: 5,
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { company: { contains: query } },
        ],
      },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { orderCode: { contains: query } },
          { customer: { name: { contains: query } } },
        ],
      },
      include: { customer: true },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { taskCode: { contains: query } },
          { title: { contains: query } },
        ],
      },
      take: 5,
    }),
  ]);

  return { employees, leads, customers, sales, tasks };
}

export async function submitClientReport(data: {
  customerName: string;
  projectTitle: string;
  status: string;
  summary: string;
  deliverables: string;
  nextWeekPlan: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userName = session.user.name || "Employee";
  const log = await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName,
      action: "SUBMIT_CLIENT_REPORT",
      module: "CLIENT_REPORTS",
      recordId: data.projectTitle,
      details: JSON.stringify({
        customerName: data.customerName,
        projectTitle: data.projectTitle,
        status: data.status,
        summary: data.summary,
        deliverables: data.deliverables,
        nextWeekPlan: data.nextWeekPlan,
        submittedAt: new Date().toISOString(),
      }),
    },
  });

  return log;
}

export async function getClientReports() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const logs = await prisma.auditLog.findMany({
    where: {
      module: "CLIENT_REPORTS",
    },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => {
    let detailsObj: any = {};
    try {
      detailsObj = JSON.parse(log.details || "{}");
    } catch {
      detailsObj = { summary: log.details };
    }

    return {
      id: log.id,
      submittedBy: log.userName,
      customerName: detailsObj.customerName || "Enterprise Client",
      projectTitle: detailsObj.projectTitle || log.recordId || "Project Milestone",
      status: detailsObj.status || "IN_PROGRESS",
      summary: detailsObj.summary || "",
      deliverables: detailsObj.deliverables || "",
      nextWeekPlan: detailsObj.nextWeekPlan || "",
      createdAt: log.createdAt,
    };
  });
}
