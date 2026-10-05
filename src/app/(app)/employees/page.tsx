import { auth } from "@/auth";
import { getEmployees, getDepartmentsAndDesignations } from "@/actions/employees";
import { getTodayAttendanceStatus, getAllAttendances } from "@/actions/attendance";
import { getTasks } from "@/actions/tasks";
import { getLeaveRequests, getHolidays, getEmployeeQueries, getSalarySlips } from "@/actions/hr";
import { getERPReports, getClientReports } from "@/actions/reports";
import { getClients } from "@/actions/clients";
import { EmployeesClient } from "@/components/EmployeesClient";

export default async function EmployeesPage() {
  const session = await auth();
  const [
    employees,
    meta,
    todayAttendance,
    allAttendances,
    tasks,
    leaves,
    holidays,
    queries,
    salarySlips,
    erpReports,
    clientReports,
    clients,
  ] = await Promise.all([
    getEmployees(),
    getDepartmentsAndDesignations(),
    getTodayAttendanceStatus(),
    getAllAttendances(),
    getTasks(),
    getLeaveRequests(),
    getHolidays(),
    getEmployeeQueries(),
    getSalarySlips(),
    getERPReports(),
    getClientReports(),
    getClients(),
  ]);

  const userRole = (session?.user as any)?.role || "EMPLOYEE";
  const currentUserId = (session?.user as any)?.id;
  const currentEmployeeId = (session?.user as any)?.employeeId;

  return (
    <EmployeesClient
      employees={employees}
      departments={meta.departments}
      designations={meta.designations}
      todayAttendance={todayAttendance}
      allAttendances={allAttendances}
      tasks={tasks}
      initialLeaves={leaves}
      initialHolidays={holidays}
      initialQueries={queries}
      initialSalarySlips={salarySlips}
      initialReports={erpReports}
      initialClientReports={clientReports}
      userRole={userRole}
      currentUserId={currentUserId}
      currentEmployeeId={currentEmployeeId}
      user={session?.user}
      assignedClients={clients}
    />
  );
}
