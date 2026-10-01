import { auth } from "@/auth";
import { getERPReports, getClientReports } from "@/actions/reports";
import { ReportsClient } from "@/components/ReportsClient";

export default async function EmployeeReportsPage() {
  const session = await auth();
  const [reports, clientReports] = await Promise.all([
    getERPReports(),
    getClientReports(),
  ]);

  const userRole = (session?.user as any)?.role || "EMPLOYEE";

  return <ReportsClient reports={reports} clientReports={clientReports} userRole={userRole} user={session?.user} />;
}
