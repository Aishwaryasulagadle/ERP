import { auth } from "@/auth";
import { getTodayAttendanceStatus, getAllAttendances } from "@/actions/attendance";
import { AttendanceClient } from "@/components/AttendanceClient";

export default async function EmployeeAttendancePage() {
  const session = await auth();
  const [todayAttendance, allAttendances] = await Promise.all([
    getTodayAttendanceStatus(),
    getAllAttendances(),
  ]);

  const userRole = (session?.user as any)?.role || "EMPLOYEE";

  return (
    <AttendanceClient
      todayAttendance={todayAttendance}
      allAttendances={allAttendances}
      userRole={userRole}
    />
  );
}
