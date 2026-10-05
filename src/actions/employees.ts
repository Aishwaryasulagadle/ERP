"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getEmployees(filters?: { departmentId?: string; search?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentUserRole = (session.user as any).role;
  const currentDeptId = (session.user as any).departmentId;

  const where: any = {};

  // Manager only sees employees under their own department
  if (currentUserRole === "MANAGER" && currentDeptId) {
    where.departmentId = currentDeptId;
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
  designationId: string;
  salary: number;
  role: string;
  address?: string;
  emergencyContact?: string;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Only Admin can add employees");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error("Email is already registered");

  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: passwordHash,
      role: data.role || "EMPLOYEE",
    },
  });

  const empCount = await prisma.employee.count();
  const employeeCode = `EMP-${String(empCount + 1).padStart(3, "0")}`;

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      userId: user.id,
      phone: data.phone,
      departmentId: data.departmentId || null,
      designationId: data.designationId || null,
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
      userName: session.user.name || "Admin",
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
