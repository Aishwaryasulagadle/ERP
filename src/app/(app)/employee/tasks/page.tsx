import { auth } from "@/auth";
import { getTasks } from "@/actions/tasks";
import { getEmployees } from "@/actions/employees";
import { TasksClient } from "@/components/TasksClient";

export default async function EmployeeTasksPage() {
  const session = await auth();
  const [tasks, employees] = await Promise.all([
    getTasks(),
    getEmployees(),
  ]);

  const userRole = (session?.user as any)?.role || "EMPLOYEE";

  return <TasksClient tasks={tasks} employees={employees} userRole={userRole} />;
}
