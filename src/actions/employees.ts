"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getEmployees(filters?: { departmentId?: string; search?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentUserRole = (session.user as any).role;
  let currentDeptId = (session.user as any).departmentId;

  // Resilient fallback: fetch department from database if session token is stale or missing it
  if (!currentDeptId && session.user.id) {
    const dbEmp = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { departmentId: true },
    });
    if (dbEmp?.departmentId) {
      currentDeptId = dbEmp.departmentId;
    }
  }

  const where: any = {
    user: { role: { not: "ADMIN" } },
  };

  // Manager only sees their own department
  if (currentUserRole === "MANAGER") {
    if (currentDeptId) {
      where.departmentId = currentDeptId;
    }
  } else if (filters?.departmentId && filters.departmentId !== "ALL") {
    where.departmentId = filters.departmentId;
  }

  if (filters?.search) {
    where.OR = [
      { employeeCode: { contains: filters.search } },
      { user: { name: { contains: filters.search } } },
      { user: { email: { contains: filters.search } } },
      { phone: { contains: filters.search } },
    ];
  }

  const employees = await prisma.employee.findMany({
    where,
    include: {
      user: true,
      department: true,
      designation: true,
      manager: { include: { user: true } },
      assignedTasks: true,
      leads: true,
      sales: true,
      attendances: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Strip salary if current user is not ADMIN or MANAGER
  return employees.map((emp) => ({
    ...emp,
    salary: currentUserRole === "ADMIN" || currentUserRole === "MANAGER" ? emp.salary : null,
  }));
}

export async function createEmployee(data: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  departmentId: string;
  designationId?: string;
  designationName?: string;
  salary: number;
  monthlyLeaveQuota?: number;
  role: string;
  address?: string;
  emergencyContact?: string;
}) {
  const session = await auth();
  const callerRole = (session?.user as any)?.role;
  const callerDeptId = (session?.user as any)?.departmentId;

  if (!session?.user || (callerRole !== "ADMIN" && callerRole !== "MANAGER")) {
    throw new Error("Only Admin or Manager can add employees");
  }

  // Manager can only assign role EMPLOYEE or MANAGER (never ADMIN), and only in their own department
  let assignedRole = data.role || "EMPLOYEE";
  if (callerRole === "MANAGER") {
    if (assignedRole === "ADMIN") {
      assignedRole = "EMPLOYEE";
    }
    if (callerDeptId && data.departmentId !== callerDeptId) {
      data.departmentId = callerDeptId;
    }
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error("Email is already registered");

  const rawPassword = data.password && data.password.trim() ? data.password.trim() : "password123";
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: passwordHash,
      role: assignedRole,
    },
  });

  // Handle designation: can be passed by designationName text or designationId
  let resolvedDesignationId = data.designationId || null;
  if (data.designationName && data.designationName.trim()) {
    const trimmedDesig = data.designationName.trim();
    const desigRecord = await prisma.designation.upsert({
      where: { name: trimmedDesig },
      update: {},
      create: {
        name: trimmedDesig,
        description: `${trimmedDesig} Role`,
      },
    });
    resolvedDesignationId = desigRecord.id;
  }

  // Generate guaranteed unique employeeCode
  const lastEmp = await prisma.employee.findFirst({
    orderBy: { employeeCode: "desc" },
    select: { employeeCode: true },
  });
  let nextNum = 1;
  if (lastEmp?.employeeCode && lastEmp.employeeCode.startsWith("EMP-")) {
    const parsed = parseInt(lastEmp.employeeCode.replace("EMP-", ""), 10);
    if (!isNaN(parsed)) {
      nextNum = parsed + 1;
    }
  }
  const employeeCode = `EMP-${String(nextNum).padStart(3, "0")}`;

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      userId: user.id,
      phone: data.phone,
      departmentId: data.departmentId || null,
      designationId: resolvedDesignationId,
      salary: Number(data.salary) || 50000,
      monthlyLeaveQuota: data.monthlyLeaveQuota !== undefined ? Number(data.monthlyLeaveQuota) : 2,
      employmentStatus: "ACTIVE",
      address: data.address,
      emergencyContact: data.emergencyContact,
    },
    include: {
      user: true,
      department: true,
      designation: true,
      manager: { include: { user: true } },
      assignedTasks: true,
      leads: true,
      sales: true,
      attendances: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "CREATE_EMPLOYEE",
      module: "EMPLOYEES",
      recordId: employee.employeeCode,
      details: `Created new employee profile ${employee.employeeCode} (${data.name})`,
    },
  });

  revalidatePath("/employees");
  return employee;
}

export async function getDepartmentsAndDesignations() {
  const [departments, designations] = await Promise.all([
    prisma.department.findMany({ include: { _count: { select: { employees: true } } } }),
    prisma.designation.findMany({ include: { _count: { select: { employees: true } } } }),
  ]);
  return { departments, designations };
}

export async function clearEmployeeActivityData() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") {
    throw new Error("Only Admin can reset employee activity data");
  }

  const [breaks, attendances, taskComments, taskHistories, tasks, leaves, queries, slips, logs] =
    await Promise.all([
      prisma.break.deleteMany({}),
      prisma.attendance.deleteMany({}),
      prisma.taskComment.deleteMany({}),
      prisma.taskHistory.deleteMany({}),
      prisma.task.deleteMany({}),
      prisma.leaveRequest.deleteMany({}),
      prisma.employeeQuery.deleteMany({}),
      prisma.salarySlip.deleteMany({}),
      prisma.deliverableLog.deleteMany({}),
    ]);

  revalidatePath("/employees");
  revalidatePath("/attendance");
  revalidatePath("/employee/reports");
  revalidatePath("/reports");

  return {
    success: true,
    cleared: {
      breaks: breaks.count,
      attendances: attendances.count,
      tasks: tasks.count,
      leaves: leaves.count,
      queries: queries.count,
      salarySlips: slips.count,
      deliverableLogs: logs.count,
    },
  };
}

export async function deleteEmployee(employeeId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") {
    throw new Error("Only Admin can delete employees");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true },
  });

  if (!employee) throw new Error("Employee not found");
  if (employee.user.role === "ADMIN") {
    throw new Error("Cannot delete an Administrator account");
  }

  // Deleting the user will cascade delete employee, attendance, salary slips, tasks, etc.
  await prisma.user.delete({
    where: { id: employee.userId },
  });

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  return { success: true };
}

export async function updateEmployee(
  employeeId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    departmentId?: string;
    designationName?: string;
    salary?: number;
    monthlyLeaveQuota?: number;
    employmentStatus?: string;
    role?: string;
    address?: string;
    emergencyContact?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const callerRole = (session.user as any)?.role;
  if (callerRole !== "ADMIN" && callerRole !== "MANAGER") {
    throw new Error("Only Admin or Manager can update employees");
  }

  const existingEmp = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true },
  });

  if (!existingEmp) throw new Error("Employee not found");

  // Manager restrictions: cannot change role to ADMIN or edit ADMINs
  let targetRole = data.role !== undefined ? data.role : existingEmp.user.role;
  if (callerRole === "MANAGER") {
    if (existingEmp.user.role === "ADMIN" || targetRole === "ADMIN") {
      throw new Error("Managers cannot modify administrator accounts or grant admin permissions");
    }
  }

  // Handle email conflict check if email is changed
  if (data.email && data.email !== existingEmp.user.email) {
    const emailConflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailConflict) throw new Error("Email address is already in use by another account");
  }

  // Update user fields
  const userUpdateData: any = {};
  if (data.name) userUpdateData.name = data.name;
  if (data.email) userUpdateData.email = data.email;
  if (data.role && callerRole === "ADMIN") userUpdateData.role = data.role;
  if (data.password && data.password.trim()) {
    userUpdateData.password = await bcrypt.hash(data.password.trim(), 10);
  }

  if (Object.keys(userUpdateData).length > 0) {
    await prisma.user.update({
      where: { id: existingEmp.userId },
      data: userUpdateData,
    });
  }

  // Handle designation
  let resolvedDesignationId = existingEmp.designationId;
  if (data.designationName && data.designationName.trim()) {
    const trimmedDesig = data.designationName.trim();
    const desigRecord = await prisma.designation.upsert({
      where: { name: trimmedDesig },
      update: {},
      create: {
        name: trimmedDesig,
        description: `${trimmedDesig} Role`,
      },
    });
    resolvedDesignationId = desigRecord.id;
  }

  // Update employee record
  const empUpdateData: any = {};
  if (data.phone !== undefined) empUpdateData.phone = data.phone;
  if (data.departmentId !== undefined) empUpdateData.departmentId = data.departmentId || null;
  if (resolvedDesignationId !== undefined) empUpdateData.designationId = resolvedDesignationId;
  if (data.salary !== undefined) empUpdateData.salary = Number(data.salary);
  if (data.monthlyLeaveQuota !== undefined) empUpdateData.monthlyLeaveQuota = Number(data.monthlyLeaveQuota);
  if (data.employmentStatus) empUpdateData.employmentStatus = data.employmentStatus;
  if (data.address !== undefined) empUpdateData.address = data.address;
  if (data.emergencyContact !== undefined) empUpdateData.emergencyContact = data.emergencyContact;

  const updatedEmployee = await prisma.employee.update({
    where: { id: employeeId },
    data: empUpdateData,
    include: {
      user: true,
      department: true,
      designation: true,
      manager: { include: { user: true } },
      assignedTasks: true,
      leads: true,
      sales: true,
      attendances: true,
    },
  });

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  return updatedEmployee;
}

