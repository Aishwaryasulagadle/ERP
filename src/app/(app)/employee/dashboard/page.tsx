import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTodayAttendanceStatus, getAllAttendances } from "@/actions/attendance";
import { getTasks } from "@/actions/tasks";
import { getLeaveRequests, getHolidays, getEmployeeQueries } from "@/actions/hr";
import {
  getEmployeeSelfData,
  getMyAttendanceCorrections,
  getMyWorkLogs,
  getMyOvertimeRequests,
} from "@/actions/employeeSelf";
import { EmployeeSelfClient } from "@/components/EmployeeSelfClient";

export default async function EmployeeDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [
    employeeData,
    todayAttendance,
    myAttendances,
    myTasks,
    myLeaves,
    myQueries,
    myCorrections,
    myWorkLogs,
    myOvertime,
    holidays,
  ] = await Promise.all([
    getEmployeeSelfData(),
    getTodayAttendanceStatus(),
    getAllAttendances(),
    getTasks(),
    getLeaveRequests(),
    getEmployeeQueries(),
    getMyAttendanceCorrections(),
    getMyWorkLogs(),
    getMyOvertimeRequests(),
    getHolidays(),
  ]);

  return (
    <EmployeeSelfClient
      user={session.user}
      employeeData={employeeData}
      todayAttendance={todayAttendance}
      myAttendances={myAttendances}
      myTasks={myTasks}
      myLeaves={myLeaves}
      myQueries={myQueries}
      myCorrections={myCorrections}
      myWorkLogs={myWorkLogs}
      myOvertime={myOvertime}
      holidays={holidays}
    />
  );
}
