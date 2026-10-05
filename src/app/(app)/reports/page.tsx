import { auth } from "@/auth";
import { getERPReports, getClientReports } from "@/actions/reports";
import { getClients, getCompanyFinancialSummary } from "@/actions/clients";
import { getEmployees } from "@/actions/employees";
import { ReportsClient } from "@/components/ReportsClient";

export default async function ReportsPage() {
  const session = await auth();
  const [reports, clientReports, clients, employees, financialSummary] = await Promise.all([
    getERPReports(),
    getClientReports(),
    getClients(),
    getEmployees(),
    getCompanyFinancialSummary(),
  ]);

  const userRole = (session?.user as any)?.role || "EMPLOYEE";
  const currentEmployeeId = (session?.user as any)?.employeeId;

  return (
    <ReportsClient
      reports={reports}
      clientReports={clientReports}
      initialClients={clients}
      employees={employees}
      financialSummary={financialSummary}
      userRole={userRole}
      currentEmployeeId={currentEmployeeId}
      user={session?.user}
    />
  );
}
