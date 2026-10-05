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

  const where: any = {};

  // Manager only sees their own department, and never sees ADMIN users
  if (currentUserRole === "MANAGER") {
    if (currentDeptId) {
      where.departmentId = currentDeptId;
    }
    where.user = { role: { not: "ADMIN" } };
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
  phone?: string;
  departmentId: string;
  designationId?: string;
  designationName?: string;
  salary: number;
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

  const passwordHash = await bcrypt.hash("password123", 10);
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

  const empCount = await prisma.employee.count();
  const employeeCode = `EMP-${String(empCount + 1).padStart(3, "0")}`;

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      userId: user.id,
      phone: data.phone,
      departmentId: data.departmentId || null,
      designationId: resolvedDesignationId,
      salary: Number(data.salary) || 50000,
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
