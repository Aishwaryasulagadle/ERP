import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function getDashboardMetrics(timeRange = "THIS_MONTH") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const user = session.user as any;
  const userRole = user.role || "EMPLOYEE";
  const deptName = (user.department || "").toLowerCase();
  const deptId = user.departmentId;
  const empId = user.employeeId;

  // Department / Role filters:
  const leadWhere: any = {};
  const orderWhere: any = {};
  const empWhere: any = { employmentStatus: "ACTIVE" };
  const taskWhere: any = {};
  const attWhere: any = {
    date: {
      gte: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  };

  if (userRole === "MANAGER" && deptId) {
    empWhere.departmentId = deptId;
    taskWhere.assignedTo = { departmentId: deptId };
    attWhere.employee = { departmentId: deptId };
    if (deptName.includes("sales")) {
      // Sales manager sees all sales department leads
    } else {
      // Tech or Marketing managers do not focus on leads/sales orders
      leadWhere.id = "none";
      orderWhere.id = "none";
    }
  } else if (userRole === "EMPLOYEE") {
    if (empId) {
      taskWhere.assignedToId = empId;
      attWhere.employeeId = empId;
      leadWhere.assignedToId = empId;
      orderWhere.employeeId = empId;
    }
    if (!deptName.includes("sales")) {
      leadWhere.id = "none";
      orderWhere.id = "none";
    }
  }

  const [
    totalLeads,
    newLeads,
    convertedLeads,
    contactedLeads,
    followUpLeads,
    lostLeads,
    orders,
    employees,
    attendances,
    tasks,
    followUpsToday,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({ where: { ...leadWhere, status: "NEW" } }),
    prisma.lead.count({ where: { ...leadWhere, status: "CONVERTED" } }),
    prisma.lead.count({ where: { ...leadWhere, status: "CONTACTED" } }),
    prisma.lead.count({ where: { ...leadWhere, status: "FOLLOW_UP" } }),
    prisma.lead.count({ where: { ...leadWhere, status: "LOST" } }),
    prisma.order.findMany({
      where: orderWhere,
      include: {
        employee: {
          include: { user: true },
        },
      },
    }),
    prisma.employee.findMany({
      where: empWhere,
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
      where: attWhere,
      include: {
        employee: { include: { user: true } },
      },
    }),
    prisma.task.findMany({
      where: taskWhere,
      include: {
        assignedTo: { include: { user: true } },
      },
    }),
    prisma.followUp.count({
      where: {
        scheduledDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ]);

  // Clients & Deliverable Stats for Marketing / Tech
  const clientWhere: any = {};
  if (deptName.includes("marketing")) {
    clientWhere.departmentType = "DIGITAL_MARKETING";
  } else if (deptName.includes("tech")) {
    clientWhere.departmentType = "TECHNICAL";
  }
  if (userRole === "EMPLOYEE" && !deptName.includes("sales") && empId) {
    clientWhere.assignments = { some: { employeeId: empId } };
  }

  const clients = await prisma.client.findMany({
    where: clientWhere,
    include: {
      services: true,
      assignments: { include: { employee: { include: { user: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalClientsCount = clients.length;
  let totalTargetDeliverables = 0;
  let totalCompletedDeliverables = 0;
  clients.forEach((c) => {
    c.services.forEach((s) => {
      totalTargetDeliverables += s.targetCount || 0;
      totalCompletedDeliverables += s.completedCount || 0;
    });
  });
  const deliverableCompletionRate =
    totalTargetDeliverables > 0
      ? Math.round((totalCompletedDeliverables / totalTargetDeliverables) * 100)
      : 0;

  const totalSalesRevenue = orders.reduce((sum, ord) => sum + ord.totalAmount, 0);
  const totalOrdersCount = orders.length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const pendingTasks = tasks.filter((t) => t.status === "PENDING").length;
  const overdueTasks = tasks.filter((t) => t.status === "OVERDUE").length;

  const presentEmployeesCount = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE" || a.checkIn).length;

  // Employee-wise Sales Table Calculation
  const employeeSalesMap: Record<string, { name: string; orders: number; sales: number; role: string }> = {};
  for (const emp of employees) {
    employeeSalesMap[emp.id] = {
      name: emp.user.name,
      orders: 0,
      sales: 0,
      role: emp.designation?.name || "Executive",
    };
  }
  for (const ord of orders) {
    if (ord.employeeId && employeeSalesMap[ord.employeeId]) {
      employeeSalesMap[ord.employeeId].orders += 1;
      employeeSalesMap[ord.employeeId].sales += ord.totalAmount;
    }
  }
  const employeeSalesList = Object.values(employeeSalesMap).sort((a, b) => b.sales - a.sales);

  const salesChartData = [
    { name: "Mon", sales: 45000, revenue: 53100 },
    { name: "Tue", sales: 120000, revenue: 141600 },
    { name: "Wed", sales: 85000, revenue: 100300 },
    { name: "Thu", sales: 265000, revenue: 312700 },
    { name: "Fri", sales: 180000, revenue: 212400 },
    { name: "Sat", sales: 65000, revenue: 76700 },
    { name: "Sun", sales: 0, revenue: 0 },
  ];

  const leadDistributionData = [
    { name: "New", count: newLeads, color: "#3B82F6" },
    { name: "Contacted", count: contactedLeads, color: "#8B5CF6" },
    { name: "Follow-up", count: followUpLeads, color: "#F59E0B" },
    { name: "Converted", count: convertedLeads, color: "#10B981" },
    { name: "Lost", count: lostLeads, color: "#EF4444" },
  ];

  return {
    kpis: {
      totalLeads,
      newLeads,
      convertedLeads,
      totalSalesRevenue,
      totalOrdersCount,
      totalEmployees: employees.length,
      presentToday: presentEmployeesCount,
      totalTasks,
      completedTasks,
      pendingTasks,
      followUpsToday,
      totalClients: totalClientsCount,
      totalTargetDeliverables,
      totalCompletedDeliverables,
      deliverableCompletionRate,
    },
    clientStats: {
      totalClients: totalClientsCount,
      totalTargetDeliverables,
      totalCompletedDeliverables,
      deliverableCompletionRate,
      clients: clients.slice(0, 6),
    },
    salesChartData,
    leadDistributionData,
    employeeSalesList,
    taskStats: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    recentOrders: orders.slice(0, 5),
    recentTasks: tasks.slice(0, 5),
  };
}

