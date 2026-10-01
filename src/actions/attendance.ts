"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getTodayAttendanceStatus() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const empId = (session.user as any).employeeId;
  if (!empId) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: empId,
      date: {
        gte: today,
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
    include: {
      breaks: { orderBy: { startTime: "desc" } },
    },
  });

  return attendance;
}

export async function clockIn() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;
  if (!empId) throw new Error("Employee record not linked");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: empId,
      date: {
        gte: today,
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
  });

  if (attendance) {
    if (attendance.checkIn) throw new Error("Already checked in today");
    attendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkIn: new Date(),
        status: "PRESENT",
      },
    });
  } else {
    attendance = await prisma.attendance.create({
      data: {
        employeeId: empId,
        date: today,
        checkIn: new Date(),
        status: "PRESENT",
      },
    });
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return attendance;
}

export async function clockOut() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;
  if (!empId) throw new Error("Employee record not linked");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: empId,
      date: {
        gte: today,
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
  });

  if (!attendance || !attendance.checkIn) {
    throw new Error("Must check in before checking out");
  }

  const checkOutTime = new Date();
  const diffMs = checkOutTime.getTime() - new Date(attendance.checkIn).getTime();
  const totalDurationMin = Math.floor(diffMs / 60000);
  const netWorkingHoursMin = Math.max(0, totalDurationMin - (attendance.breakDurationMin || 0));

  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOut: checkOutTime,
      workingHoursMin: netWorkingHoursMin,
    },
  });

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return updated;
}

export async function toggleBreak() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const empId = (session.user as any).employeeId;
  if (!empId) throw new Error("Employee record not linked");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: empId,
      date: {
        gte: today,
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
    include: { breaks: { orderBy: { startTime: "desc" } } },
  });

  if (!attendance || !attendance.checkIn) throw new Error("Please check in first");

  const ongoingBreak = attendance.breaks.find((b) => !b.endTime);

  if (ongoingBreak) {
    // End ongoing break
    const endTime = new Date();
    const durationMin = Math.floor((endTime.getTime() - new Date(ongoingBreak.startTime).getTime()) / 60000);
    await prisma.break.update({
      where: { id: ongoingBreak.id },
      data: {
        endTime,
        durationMin,
      },
    });

    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        breakDurationMin: {
          increment: durationMin,
        },
      },
    });
  } else {
    // Start new break
    await prisma.break.create({
      data: {
        attendanceId: attendance.id,
        startTime: new Date(),
      },
    });
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return true;
}

export async function getAllAttendances(filters?: { date?: string; departmentId?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const where: any = {};
  if (filters?.departmentId && filters.departmentId !== "ALL") {
    where.employee = { departmentId: filters.departmentId };
  }

  return await prisma.attendance.findMany({
    where,
    include: {
      employee: {
        include: {
          user: true,
          department: true,
          designation: true,
        },
      },
      breaks: true,
    },
    orderBy: { date: "desc" },
  });
}
