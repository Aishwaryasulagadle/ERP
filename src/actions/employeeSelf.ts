"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * 1. Get Employee Profile & Info (Self-Service)
 */
export async function getEmployeeSelfData() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const empId = (session.user as any).employeeId;
  const userId = session.user.id;

  // Retrieve or link employee record
  let employee = empId
    ? await prisma.employee.findUnique({
        where: { id: empId },
        include: {
          user: true,
          department: true,
          designation: true,
          manager: { include: { user: true } },
        },
      })
    : await prisma.employee.findFirst({
        where: { userId },
        include: {
          user: true,
          department: true,
          designation: true,
          manager: { include: { user: true } },
        },
      });

  if (!employee) {
    // If user has no employee profile, query user details
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return {
      employee: {
        id: "",
        employeeCode: "EMP-SELF",
        user,
        phone: "",
        profilePhoto: user?.image || "",
        address: "",
        emergencyContact: "",
        joiningDate: new Date(),
        salary: 0,
        department: { name: "General Operations" },
        designation: { name: "Staff Member" },
        manager: null,
      },
      leaveBalance: {
        casual: { total: 12, used: 4, remaining: 8, pending: 1 },
        sick: { total: 10, used: 5, remaining: 5, pending: 0 },
        paid: { total: 15, used: 5, remaining: 10, pending: 0 },
      },
    };
  }

  // Calculate actual leave usage from LeaveRequest table
  const leaves = await prisma.leaveRequest.findMany({
    where: { employeeId: employee.id },
  });

  const casualUsed = leaves
    .filter((l) => l.type === "CASUAL" && l.status === "APPROVED")
    .reduce((sum, l) => sum + l.daysCount, 0);
  const casualPending = leaves
    .filter((l) => l.type === "CASUAL" && l.status === "PENDING")
    .reduce((sum, l) => sum + l.daysCount, 0);

  const sickUsed = leaves
    .filter((l) => l.type === "SICK" && l.status === "APPROVED")
    .reduce((sum, l) => sum + l.daysCount, 0);
  const sickPending = leaves
    .filter((l) => l.type === "SICK" && l.status === "PENDING")
    .reduce((sum, l) => sum + l.daysCount, 0);

  const paidUsed = leaves
    .filter((l) => l.type === "PAID" && l.status === "APPROVED")
    .reduce((sum, l) => sum + l.daysCount, 0);
  const paidPending = leaves
    .filter((l) => l.type === "PAID" && l.status === "PENDING")
    .reduce((sum, l) => sum + l.daysCount, 0);

  return {
    employee,
    leaveBalance: {
      casual: { total: 12, used: casualUsed, remaining: Math.max(0, 12 - casualUsed), pending: casualPending },
      sick: { total: 10, used: sickUsed, remaining: Math.max(0, 10 - sickUsed), pending: sickPending },
      paid: { total: 15, used: paidUsed, remaining: Math.max(0, 15 - paidUsed), pending: paidPending },
    },
  };
}

/**
 * 2. Update editable profile information (Phone, Address, Emergency Contact, Profile Photo)
 */
export async function updateOwnProfile(data: {
  phone?: string;
  address?: string;
  emergencyContact?: string;
  profilePhoto?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const empId = (session.user as any).employeeId;
  const userId = session.user.id;

  let emp = empId ? await prisma.employee.findUnique({ where: { id: empId } }) : await prisma.employee.findFirst({ where: { userId } });

  if (emp) {
    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        phone: data.phone,
        address: data.address,
        emergencyContact: data.emergencyContact,
        profilePhoto: data.profilePhoto,
      },
    });
  }

  revalidatePath("/employee/dashboard");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * 3. Attendance Correction Requests
 */
export async function getMyAttendanceCorrections() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;
  if (!empId) return [];

  return await (prisma as any).attendanceCorrection.findMany({
    where: { employeeId: empId },
    orderBy: { date: "desc" },
  });
}

export async function submitAttendanceCorrection(data: {
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  attachment?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;
  if (!empId) throw new Error("Employee profile required");

  const reqCheckIn = data.requestedCheckIn ? new Date(`${data.date}T${data.requestedCheckIn}:00`) : null;
  const reqCheckOut = data.requestedCheckOut ? new Date(`${data.date}T${data.requestedCheckOut}:00`) : null;

  const correction = await (prisma as any).attendanceCorrection.create({
    data: {
      employeeId: empId,
      date: new Date(data.date),
      requestedCheckIn: reqCheckIn,
      requestedCheckOut: reqCheckOut,
      reason: data.reason,
      attachment: data.attachment || null,
      status: "PENDING",
    },
  });

  revalidatePath("/employee/dashboard");
  revalidatePath("/attendance");
  return correction;
}

export async function cancelAttendanceCorrection(correctionId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;

  const existing = await (prisma as any).attendanceCorrection.findUnique({ where: { id: correctionId } });
  if (!existing || existing.employeeId !== empId) throw new Error("Permission denied");
  if (existing.status !== "PENDING") throw new Error("Only pending requests can be cancelled");

  await (prisma as any).attendanceCorrection.update({
    where: { id: correctionId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/employee/dashboard");
  return { success: true };
}

/**
 * 4. Daily Work Logs
 */
export async function getMyWorkLogs(filterPeriod?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;
  if (!empId) return [];

  const where: any = { employeeId: empId };
  const now = new Date();

  if (filterPeriod === "TODAY") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.date = { gte: today };
  } else if (filterPeriod === "THIS_WEEK") {
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    where.date = { gte: startOfWeek };
  } else if (filterPeriod === "THIS_MONTH") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    where.date = { gte: startOfMonth };
  }

  return await (prisma as any).workLog.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function createWorkLog(data: {
  taskId?: string;
  taskTitle?: string;
  date: string;
  description: string;
  startTime?: string;
  endTime?: string;
  hoursSpent: number;
  progressPct?: number;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;
  if (!empId) throw new Error("Employee profile required");

  const sTime = data.startTime ? new Date(`${data.date}T${data.startTime}:00`) : null;
  const eTime = data.endTime ? new Date(`${data.date}T${data.endTime}:00`) : null;

  const log = await (prisma as any).workLog.create({
    data: {
      employeeId: empId,
      taskId: data.taskId || null,
      taskTitle: data.taskTitle || "General Work",
      date: new Date(data.date),
      description: data.description,
      startTime: sTime,
      endTime: eTime,
      hoursSpent: Number(data.hoursSpent) || 0,
      progressPct: Number(data.progressPct) || 100,
      notes: data.notes || null,
    },
  });

  revalidatePath("/employee/dashboard");
  return log;
}

export async function updateWorkLog(
  logId: string,
  data: {
    description?: string;
    hoursSpent?: number;
    progressPct?: number;
    notes?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;

  const existing = await (prisma as any).workLog.findUnique({ where: { id: logId } });
  if (!existing || existing.employeeId !== empId) throw new Error("Permission denied");

  const updated = await (prisma as any).workLog.update({
    where: { id: logId },
    data: {
      description: data.description ?? existing.description,
      hoursSpent: data.hoursSpent !== undefined ? Number(data.hoursSpent) : existing.hoursSpent,
      progressPct: data.progressPct !== undefined ? Number(data.progressPct) : existing.progressPct,
      notes: data.notes ?? existing.notes,
    },
  });

  revalidatePath("/employee/dashboard");
  return updated;
}

/**
 * 5. Overtime Requests
 */
export async function getMyOvertimeRequests() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;
  if (!empId) return [];

  return await (prisma as any).overtimeRequest.findMany({
    where: { employeeId: empId },
    orderBy: { date: "desc" },
  });
}

export async function submitOvertimeRequest(data: {
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  reason: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;
  if (!empId) throw new Error("Employee profile required");

  const start = new Date(`${data.date}T${data.startTime}:00`);
  const end = new Date(`${data.date}T${data.endTime}:00`);

  const ot = await (prisma as any).overtimeRequest.create({
    data: {
      employeeId: empId,
      date: new Date(data.date),
      startTime: start,
      endTime: end,
      totalHours: Number(data.totalHours) || 0,
      reason: data.reason,
      status: "PENDING",
    },
  });

  revalidatePath("/employee/dashboard");
  return ot;
}

export async function cancelOvertimeRequest(otId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;

  const existing = await (prisma as any).overtimeRequest.findUnique({ where: { id: otId } });
  if (!existing || existing.employeeId !== empId) throw new Error("Permission denied");
  if (existing.status !== "PENDING") throw new Error("Only pending requests can be cancelled");

  await (prisma as any).overtimeRequest.update({
    where: { id: otId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/employee/dashboard");
  return { success: true };
}

/**
 * 6. Leave Requests (Employee Self-Service Actions)
 */
export async function updateOwnPendingLeave(leaveId: string, data: { startDate: string; endDate: string; reason: string; type: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;

  const existing = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
  if (!existing || existing.employeeId !== empId) throw new Error("Permission denied");
  if (existing.status !== "PENDING") throw new Error("Cannot edit reviewed leave requests");

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      startDate: start,
      endDate: end,
      type: data.type,
      reason: data.reason,
      daysCount: calculatedDays,
    },
  });

  revalidatePath("/employee/dashboard");
  return updated;
}

export async function cancelOwnLeaveRequest(leaveId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;

  const existing = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
  if (!existing || existing.employeeId !== empId) throw new Error("Permission denied");
  if (existing.status !== "PENDING") throw new Error("Cannot cancel non-pending leave request");

  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/employee/dashboard");
  return updated;
}

/**
 * 7. Helpdesk / Query Close Action (Self-Service)
 */
export async function closeOwnQuery(queryId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;

  const existing = await prisma.employeeQuery.findUnique({ where: { id: queryId } });
  if (!existing || existing.employeeId !== empId) throw new Error("Permission denied");

  const updated = await prisma.employeeQuery.update({
    where: { id: queryId },
    data: { status: "CLOSED" },
  });

  revalidatePath("/employee/dashboard");
  return updated;
}
