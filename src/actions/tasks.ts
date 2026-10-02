"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getTasks(filters?: { status?: string; search?: string; assignedToId?: string; priority?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const where: any = {};
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }
  if (filters?.priority && filters.priority !== "ALL") {
    where.priority = filters.priority;
  }
  if (filters?.assignedToId && filters.assignedToId !== "ALL") {
    where.assignedToId = filters.assignedToId;
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
      { taskCode: { contains: filters.search } },
    ];
  }

  // If role is EMPLOYEE, fetch tasks assigned to them
  if ((session.user as any).role === "EMPLOYEE") {
    const empId = (session.user as any).employeeId;
    if (empId) {
      where.assignedToId = empId;
    }
  }

  return await prisma.task.findMany({
    where,
    include: {
      assignedTo: { include: { user: true, designation: true } },
      createdBy: { include: { user: true } },
      comments: {
        include: { author: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      },
      histories: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function createTask(data: {
  title: string;
  description: string;
  assignedToId?: string;
  priority: string;
  dueDate: string;
  estimatedHours: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const taskCount = await prisma.task.count();
  const taskCode = `TSK-${100 + taskCount + 1}`;

  const task = await prisma.task.create({
    data: {
      taskCode,
      title: data.title,
      description: data.description,
      assignedToId: data.assignedToId || null,
      createdById: (session.user as any).employeeId || null,
      priority: data.priority || "MEDIUM",
      dueDate: new Date(data.dueDate),
      estimatedHours: Number(data.estimatedHours) || 0,
      status: "PENDING",
    },
  });

  // Task audit history
  await prisma.taskHistory.create({
    data: {
      taskId: task.id,
      field: "STATUS",
      oldValue: "NONE",
      newValue: "PENDING",
      changedBy: session.user.name || "User",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "CREATE_TASK",
      module: "TASKS",
      recordId: task.taskCode,
      details: `Created task ${task.taskCode}: ${task.title}`,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

export async function updateTaskStatus(taskId: string, status: string, actualHours?: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) throw new Error("Task not found");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      actualHours: actualHours !== undefined ? Number(actualHours) : existing.actualHours,
      completedDate: status === "COMPLETED" ? new Date() : null,
    },
  });

  await prisma.taskHistory.create({
    data: {
      taskId,
      field: "STATUS",
      oldValue: existing.status,
      newValue: status,
      changedBy: session.user.name || "User",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "UPDATE_TASK_STATUS",
      module: "TASKS",
      recordId: updated.taskCode,
      details: `Changed task ${updated.taskCode} status from ${existing.status} to ${status}`,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return updated;
}

export async function logTaskHourlyProgress(data: {
  taskId: string;
  hoursSpent: number;
  progressNote?: string;
  newStatus?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await prisma.task.findUnique({
    where: { id: data.taskId },
    include: { comments: true }
  });
  if (!existing) throw new Error("Task not found");

  const addedHours = Number(data.hoursSpent) || 0;
  const newActualHours = Math.max(0, existing.actualHours + addedHours);
  
  let newStatus = data.newStatus || existing.status;
  if (existing.status === "PENDING" && addedHours > 0 && !data.newStatus) {
    newStatus = "IN_PROGRESS";
  }

  const updated = await prisma.task.update({
    where: { id: data.taskId },
    data: {
      actualHours: newActualHours,
      status: newStatus,
      completedDate: newStatus === "COMPLETED" ? new Date() : existing.completedDate,
    },
    include: {
      assignedTo: { include: { user: true, designation: true } },
      createdBy: { include: { user: true } },
      comments: {
        include: { author: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      },
      histories: { orderBy: { createdAt: "desc" } },
    }
  });

  const employeeId = (session.user as any).employeeId;
  const noteText = data.progressNote?.trim() 
    ? `⏱️ Logged ${addedHours}h progress (Total: ${newActualHours}h / Est: ${existing.estimatedHours}h). Note: ${data.progressNote}`
    : `⏱️ Logged ${addedHours}h progress (Total: ${newActualHours}h / Est: ${existing.estimatedHours}h).`;

  if (employeeId) {
    await prisma.taskComment.create({
      data: {
        taskId: data.taskId,
        authorId: employeeId,
        comment: noteText,
      },
    });
  }

  await prisma.taskHistory.create({
    data: {
      taskId: data.taskId,
      field: "HOURLY_PROGRESS",
      oldValue: `${existing.actualHours} hrs (${existing.status})`,
      newValue: `${newActualHours} hrs (${newStatus})`,
      changedBy: session.user.name || "User",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      action: "LOG_TASK_HOURS",
      module: "TASKS",
      recordId: updated.taskCode,
      details: `Logged ${addedHours}h work on task ${updated.taskCode}. Total hours: ${newActualHours}h.`,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/employee/tasks");
  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return updated;
}

export async function addTaskComment(taskId: string, comment: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const authorId = (session.user as any).employeeId;
  if (!authorId) throw new Error("Employee profile required to post comments");

  const newComment = await prisma.taskComment.create({
    data: {
      taskId,
      authorId,
      comment,
    },
    include: {
      author: { include: { user: true } },
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/employee/tasks");
  revalidatePath("/employees");
  return newComment;
}

