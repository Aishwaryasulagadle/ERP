"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// -------------------------------------------------------------
// 1. LEAVE & WORK FROM HOME & HALF DAY MANAGEMENT
// -------------------------------------------------------------

export async function getLeaveRequests(filters?: { status?: string; employeeId?: string; type?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentUserRole = (session.user as any).role;
  const currentEmpId = (session.user as any).employeeId;

  const where: any = {};
  if (currentUserRole === "EMPLOYEE" && currentEmpId) {
    where.employeeId = currentEmpId;
  } else if (filters?.employeeId && filters.employeeId !== "ALL") {
    where.employeeId = filters.employeeId;
  }

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters?.type && filters.type !== "ALL") {
    where.type = filters.type;
  }

  return await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        include: {
          user: true,
          department: true,
          designation: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function applyLeave(data: {
  type: string; // CASUAL, SICK, PAID, UNPAID, HALF_DAY, WORK_FROM_HOME
  startDate: string;
  endDate: string;
  daysCount?: number;
  halfDayType?: string; // FIRST_HALF, SECOND_HALF, null
  reason: string;
  employeeId?: string; // Optional if admin is applying on behalf
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentEmpId = (session.user as any).employeeId;
  const currentUserRole = (session.user as any).role;

  let empId = currentEmpId;
  if ((currentUserRole === "ADMIN" || currentUserRole === "MANAGER") && data.employeeId) {
    empId = data.employeeId;
  }

  if (!empId) throw new Error("Employee record not linked to user");

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  let calculatedDays = Number(data.daysCount) || 1;
  if (data.type === "HALF_DAY") {
    calculatedDays = 0.5;
  }

  const newLeave = await prisma.leaveRequest.create({
    data: {
      employeeId: empId,
      type: data.type,
      startDate: start,
      endDate: end,
      daysCount: calculatedDays,
      halfDayType: data.halfDayType || null,
      reason: data.reason,
      status: "PENDING",
    },
    include: {
      employee: {
        include: { user: true },
      },
    },
  });

  // Log in Audit
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "Employee",
      action: `APPLY_${data.type}`,
      module: "LEAVE_MANAGEMENT",
      recordId: newLeave.id,
      details: `Applied for ${data.type} from ${data.startDate} to ${data.endDate} (${calculatedDays} days)`,
    },
  });

  revalidatePath("/employees");
  return newLeave;
}

export async function assignLeaveOrWFH(data: {
  target: "ALL" | "SINGLE";
  employeeId?: string;
  type: string; // CASUAL, SICK, PAID, UNPAID, HALF_DAY, WORK_FROM_HOME
  startDate: string;
  endDate: string;
  halfDayType?: string; // FIRST_HALF, SECOND_HALF
  reason: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userRole = (session.user as any).role;

  if (userRole !== "ADMIN" && userRole !== "MANAGER") {
    throw new Error("Only Admin or Manager can assign Leave / WFH");
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  let calculatedDays = 1;
  if (data.type === "HALF_DAY") {
    calculatedDays = 0.5;
  } else {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }

  let employeeIds: string[] = [];

  if (data.target === "ALL") {
    const allEmps = await prisma.employee.findMany({ select: { id: true } });
    employeeIds = allEmps.map((e) => e.id);
  } else {
    if (!data.employeeId) throw new Error("Employee must be selected");
    employeeIds = [data.employeeId];
  }

  const createdRecords = [];

  for (const empId of employeeIds) {
    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: empId,
        type: data.type,
        startDate: start,
        endDate: end,
        daysCount: calculatedDays,
        halfDayType: data.halfDayType || null,
        reason: data.reason || `Admin Assigned: ${data.type.replace(/_/g, " ")}`,
        status: "APPROVED", // Auto-approved since admin assigned it
        approvedBy: session.user.name || "Admin",
        reviewNote: "Directly assigned by Admin/Manager",
      },
      include: {
        employee: {
          include: { user: true },
        },
      },
    });

    // Update Attendance record for the start date
    const leaveDate = new Date(start);
    leaveDate.setHours(0, 0, 0, 0);

    let attStatus = "LEAVE";
    if (data.type === "HALF_DAY") attStatus = "HALF_DAY";
    if (data.type === "WORK_FROM_HOME") attStatus = "WORK_FROM_HOME";

    const existingAtt = await prisma.attendance.findFirst({
      where: {
        employeeId: empId,
        date: {
          gte: leaveDate,
          lte: new Date(new Date(leaveDate).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingAtt) {
      await prisma.attendance.update({
        where: { id: existingAtt.id },
        data: { status: attStatus, notes: `Admin Assigned ${data.type}: ${data.reason}` },
      });
    } else {
      await prisma.attendance.create({
        data: {
          employeeId: empId,
          date: leaveDate,
          status: attStatus,
          notes: `Admin Assigned ${data.type}: ${data.reason}`,
        },
      });
    }

    createdRecords.push(leave);
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "Admin",
      action: `ASSIGN_${data.type}`,
      module: "LEAVE_MANAGEMENT",
      recordId: `${data.target}_${data.type}`,
      details: `Admin assigned ${data.type} to ${data.target === "ALL" ? "All Employees" : employeeIds.length + " employee"} from ${data.startDate} to ${data.endDate}`,
    },
  });

  revalidatePath("/employees");
  revalidatePath("/attendance");
  return createdRecords;
}

export async function updateLeaveStatus(leaveId: string, status: "APPROVED" | "REJECTED" | "CANCELLED", reviewNote?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userRole = (session.user as any).role;

  if (userRole !== "ADMIN" && userRole !== "MANAGER") {
    throw new Error("Only Managers or Admins can review leave requests");
  }

  const updatedLeave = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status,
      approvedBy: session.user.name || "Manager",
      reviewNote: reviewNote || null,
    },
    include: {
      employee: {
        include: { user: true },
      },
    },
  });

  // If approved and type is HALF_DAY, WORK_FROM_HOME, or regular LEAVE, update or create Attendance if applicable
  if (status === "APPROVED") {
    const leaveDate = new Date(updatedLeave.startDate);
    leaveDate.setHours(0, 0, 0, 0);

    let attStatus = "LEAVE";
    if (updatedLeave.type === "HALF_DAY") attStatus = "HALF_DAY";
    if (updatedLeave.type === "WORK_FROM_HOME") attStatus = "WORK_FROM_HOME";

    const existingAtt = await prisma.attendance.findFirst({
      where: {
        employeeId: updatedLeave.employeeId,
        date: {
          gte: leaveDate,
          lte: new Date(new Date(leaveDate).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingAtt) {
      await prisma.attendance.update({
        where: { id: existingAtt.id },
        data: { status: attStatus, notes: `Approved ${updatedLeave.type}: ${updatedLeave.reason}` },
      });
    } else {
      await prisma.attendance.create({
        data: {
          employeeId: updatedLeave.employeeId,
          date: leaveDate,
          status: attStatus,
          notes: `Approved ${updatedLeave.type}: ${updatedLeave.reason}`,
        },
      });
    }
  }

  revalidatePath("/employees");
  return updatedLeave;
}

// -------------------------------------------------------------
// 2. HOLIDAYS & SUNDAYS / WEEKEND MANAGEMENT
// -------------------------------------------------------------

export async function getHolidays(year?: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetYear = year || new Date().getFullYear();
  const startOfYear = new Date(targetYear, 0, 1);
  const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

  let holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    orderBy: { date: "asc" },
  });

  // Seed default company holidays & calendar if none exist for this year
  if (holidays.length === 0) {
    const defaultHolidays = [
      { title: "New Year's Day", date: new Date(targetYear, 0, 1), type: "NATIONAL", description: "Global New Year celebration" },
      { title: "Republic Day", date: new Date(targetYear, 0, 26), type: "NATIONAL", description: "National Holiday" },
      { title: "Holi Festival", date: new Date(targetYear, 2, 17), type: "FESTIVAL", description: "Festival of Colors" },
      { title: "Eid al-Fitr", date: new Date(targetYear, 2, 31), type: "FESTIVAL", description: "Religious festival celebration" },
      { title: "May Day / Labour Day", date: new Date(targetYear, 4, 1), type: "NATIONAL", description: "International Workers' Day" },
      { title: "Independence Day", date: new Date(targetYear, 7, 15), type: "NATIONAL", description: "National Independence Day" },
      { title: "Gandhi Jayanti", date: new Date(targetYear, 9, 2), type: "NATIONAL", description: "Mahatma Gandhi Birthday" },
      { title: "Dussehra", date: new Date(targetYear, 9, 20), type: "FESTIVAL", description: "Vijayadashami festival" },
      { title: "Diwali (Deepavali)", date: new Date(targetYear, 10, 8), type: "FESTIVAL", description: "Festival of Lights" },
      { title: "Christmas", date: new Date(targetYear, 11, 25), type: "FESTIVAL", description: "Christmas Day celebration" },
    ];

    for (const h of defaultHolidays) {
      await prisma.holiday.upsert({
        where: { date: h.date },
        update: {},
        create: {
          title: h.title,
          date: h.date,
          type: h.type,
          description: h.description,
          isRecurring: true,
        },
      });
    }

    holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      orderBy: { date: "asc" },
    });
  }

  return holidays;
}

export async function addHoliday(data: {
  title: string;
  date: string;
  type: string; // NATIONAL, FESTIVAL, OPTIONAL, SUNDAY, COMPANY_OFF
  description?: string;
  isRecurring?: boolean;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN" && userRole !== "MANAGER") {
    throw new Error("Only Admin can mark holidays");
  }

  const holidayDate = new Date(data.date);
  holidayDate.setHours(0, 0, 0, 0);

  const holiday = await prisma.holiday.upsert({
    where: { date: holidayDate },
    update: {
      title: data.title,
      type: data.type,
      description: data.description,
      isRecurring: Boolean(data.isRecurring),
    },
    create: {
      title: data.title,
      date: holidayDate,
      type: data.type,
      description: data.description,
      isRecurring: Boolean(data.isRecurring),
    },
  });

  revalidatePath("/employees");
  return holiday;
}

export async function deleteHoliday(holidayId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") {
    throw new Error("Only Admin can delete holidays");
  }

  await prisma.holiday.delete({ where: { id: holidayId } });
  revalidatePath("/employees");
  return true;
}

// -------------------------------------------------------------
// 3. EMPLOYEE QUERIES / HELPDESK SYSTEM
// -------------------------------------------------------------

export async function getEmployeeQueries(filters?: { status?: string; category?: string; employeeId?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentUserRole = (session.user as any).role;
  const currentEmpId = (session.user as any).employeeId;

  const where: any = {};
  if (currentUserRole === "EMPLOYEE" && currentEmpId) {
    where.employeeId = currentEmpId;
  } else if (filters?.employeeId && filters.employeeId !== "ALL") {
    where.employeeId = filters.employeeId;
  }

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters?.category && filters.category !== "ALL") {
    where.category = filters.category;
  }

  return await prisma.employeeQuery.findMany({
    where,
    include: {
      employee: {
        include: {
          user: true,
          department: true,
          designation: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEmployeeQuery(data: {
  category: string;
  subject: string;
  description: string;
  priority?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const currentEmpId = (session.user as any).employeeId;

  if (!currentEmpId) throw new Error("Employee record required to raise query");

  const totalQueries = await prisma.employeeQuery.count();
  const queryCode = `QRY-${String(totalQueries + 1).padStart(4, "0")}`;

  const query = await prisma.employeeQuery.create({
    data: {
      queryCode,
      employeeId: currentEmpId,
      category: data.category,
      subject: data.subject,
      description: data.description,
      priority: data.priority || "MEDIUM",
      status: "OPEN",
    },
    include: {
      employee: { include: { user: true } },
    },
  });

  revalidatePath("/employees");
  return query;
}

export async function resolveEmployeeQuery(queryId: string, responseText: string, newStatus: string = "RESOLVED") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userRole = (session.user as any).role;

  if (userRole !== "ADMIN" && userRole !== "MANAGER") {
    throw new Error("Only Admins or HR Managers can resolve queries");
  }

  const updatedQuery = await prisma.employeeQuery.update({
    where: { id: queryId },
    data: {
      status: newStatus,
      response: responseText,
      resolvedBy: session.user.name || "HR Admin",
      resolvedAt: new Date(),
    },
    include: {
      employee: { include: { user: true } },
    },
  });

  revalidatePath("/employees");
  return updatedQuery;
}

// -------------------------------------------------------------
// 4. SALARY SLIP & PAYROLL MANAGEMENT
// -------------------------------------------------------------

export async function getSalarySlips(filters?: { employeeId?: string; month?: number; year?: number }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentUserRole = (session.user as any).role;
  const currentEmpId = (session.user as any).employeeId;

  const currentMonth = filters?.month ? Number(filters.month) : new Date().getMonth() + 1;
  const currentYear = filters?.year ? Number(filters.year) : new Date().getFullYear();

  // Auto-generate current month salary slips for all active employees if they do not exist
  const allEmployees = await prisma.employee.findMany({
    where: { employmentStatus: "ACTIVE" },
    include: { user: true, department: true, designation: true },
  });

  for (const emp of allEmployees) {
    const existing = await prisma.salarySlip.findFirst({
      where: {
        employeeId: emp.id,
        month: currentMonth,
        year: currentYear,
      },
    });

    if (!existing) {
      const basic = emp.salary ? Math.round(emp.salary * 0.5) : 35000;
      const hra = Math.round(basic * 0.4);
      const specialAllow = Math.round(basic * 0.2);
      const grossSalary = emp.salary || (basic + hra + specialAllow);
      const pfDeduction = Math.round(basic * 0.12);
      const taxDeduction = grossSalary > 50000 ? Math.round(grossSalary * 0.05) : 0;
      const totalDeduction = pfDeduction + taxDeduction;
      const netSalary = grossSalary - totalDeduction;

      const monthStr = String(currentMonth).padStart(2, "0");
      const slipCode = `PAY-${currentYear}${monthStr}-${emp.employeeCode || Math.floor(1000 + Math.random() * 9000)}`;

      await prisma.salarySlip.create({
        data: {
          slipCode,
          employeeId: emp.id,
          month: currentMonth,
          year: currentYear,
          basicSalary: basic,
          hra,
          specialAllow,
          bonus: 0,
          grossSalary,
          pfDeduction,
          taxDeduction,
          leaveDeduction: 0,
          otherDeduction: 0,
          totalDeduction,
          netSalary,
          totalWorkingDays: 30,
          presentDays: 28,
          paidLeaves: (emp as any).monthlyLeaveQuota || 2,
          wfhDays: 0,
          halfDays: 0,
          unpaidLeaves: 0,
          paymentStatus: "PAID",
          paymentDate: new Date(),
          notes: `Auto-generated payroll slip for ${monthStr}/${currentYear}`,
        },
      });
    }
  }

  const where: any = {};
  if (currentUserRole === "EMPLOYEE" && currentEmpId) {
    where.employeeId = currentEmpId;
  } else if (filters?.employeeId && filters.employeeId !== "ALL") {
    where.employeeId = filters.employeeId;
  }

  if (filters?.month) where.month = Number(filters.month);
  if (filters?.year) where.year = Number(filters.year);

  return await prisma.salarySlip.findMany({
    where,
    include: {
      employee: {
        include: {
          user: true,
          department: true,
          designation: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function generateSalarySlip(data: {
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra?: number;
  specialAllow?: number;
  bonus?: number;
  pfDeduction?: number;
  taxDeduction?: number;
  otherDeduction?: number;
  totalWorkingDays?: number;
  presentDays?: number;
  paidLeaves?: number;
  wfhDays?: number;
  halfDays?: number;
  unpaidLeaves?: number;
  paymentStatus?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userRole = (session.user as any).role;

  if (userRole !== "ADMIN" && userRole !== "MANAGER") {
    throw new Error("Only Admin can generate salary slips");
  }

  const basic = Number(data.basicSalary) || 0;
  const hra = Number(data.hra) || Math.round(basic * 0.4);
  const specialAllow = Number(data.specialAllow) || Math.round(basic * 0.2);
  const bonus = Number(data.bonus) || 0;
  const grossSalary = basic + hra + specialAllow + bonus;

  const totalWorkingDays = Number(data.totalWorkingDays) || 30;
  const unpaidLeaves = Number(data.unpaidLeaves) || 0;
  const halfDays = Number(data.halfDays) || 0;

  const perDaySalary = grossSalary / totalWorkingDays;
  const leaveDeduction = Math.round((unpaidLeaves * perDaySalary) + (halfDays * 0.5 * perDaySalary));

  const pfDeduction = Number(data.pfDeduction) || Math.round(basic * 0.12);
  const taxDeduction = Number(data.taxDeduction) || (grossSalary > 50000 ? Math.round(grossSalary * 0.05) : 0);
  const otherDeduction = Number(data.otherDeduction) || 0;

  const totalDeduction = pfDeduction + taxDeduction + leaveDeduction + otherDeduction;
  const netSalary = Math.max(0, grossSalary - totalDeduction);

  const monthStr = String(data.month).padStart(2, "0");
  const slipCode = `PAY-${data.year}${monthStr}-${Math.floor(1000 + Math.random() * 9000)}`;

  const existingSlip = await prisma.salarySlip.findFirst({
    where: {
      employeeId: data.employeeId,
      month: Number(data.month),
      year: Number(data.year),
    },
  });

  let slip;
  if (existingSlip) {
    slip = await prisma.salarySlip.update({
      where: { id: existingSlip.id },
      data: {
        basicSalary: basic,
        hra,
        specialAllow,
        bonus,
        grossSalary,
        pfDeduction,
        taxDeduction,
        leaveDeduction,
        otherDeduction,
        totalDeduction,
        netSalary,
        totalWorkingDays,
        presentDays: Number(data.presentDays) || 28,
        paidLeaves: Number(data.paidLeaves) || 2,
        wfhDays: Number(data.wfhDays) || 0,
        halfDays,
        unpaidLeaves,
        paymentStatus: data.paymentStatus || "PAID",
        paymentDate: new Date(),
        notes: data.notes || `Generated payroll for ${monthStr}/${data.year}`,
      },
      include: { employee: { include: { user: true, department: true, designation: true } } },
    });
  } else {
    slip = await prisma.salarySlip.create({
      data: {
        slipCode,
        employeeId: data.employeeId,
        month: Number(data.month),
        year: Number(data.year),
        basicSalary: basic,
        hra,
        specialAllow,
        bonus,
        grossSalary,
        pfDeduction,
        taxDeduction,
        leaveDeduction,
        otherDeduction,
        totalDeduction,
        netSalary,
        totalWorkingDays,
        presentDays: Number(data.presentDays) || 28,
        paidLeaves: Number(data.paidLeaves) || 2,
        wfhDays: Number(data.wfhDays) || 0,
        halfDays,
        unpaidLeaves,
        paymentStatus: data.paymentStatus || "PAID",
        paymentDate: new Date(),
        notes: data.notes || `Generated payroll for ${monthStr}/${data.year}`,
      },
      include: { employee: { include: { user: true, department: true, designation: true } } },
    });
  }

  revalidatePath("/employees");
  return slip;
}
