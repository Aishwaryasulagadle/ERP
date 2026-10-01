import { auth } from "@/auth";
import { getEmployees, getDepartmentsAndDesignations } from "@/actions/employees";
import { getTodayAttendanceStatus, getAllAttendances } from "@/actions/attendance";
import { getTasks } from "@/actions/tasks";
import { EmployeesClient } from "@/components/EmployeesClient";

export default async function EmployeesPage() {
  const session = await auth();
  const [employees, meta, todayAttendance, allAttendances, tasks] = await Promise.all([
    getEmployees(),
    getDepartmentsAndDesignations(),
    getTodayAttendanceStatus(),
    getAllAttendances(),
    getTasks(),
  ]);

  const userRole = (session?.user as any)?.role || "EMPLOYEE";

  return (
    <EmployeesClient
      employees={employees}
      departments={meta.departments}
      designations={meta.designations}
      todayAttendance={todayAttendance}
      allAttendances={allAttendances}
      tasks={tasks}
      userRole={userRole}
    />
  );
}
