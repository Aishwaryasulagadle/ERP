import { auth } from "@/auth";
import { getERPReports, getClientReports } from "@/actions/reports";
import { getClients } from "@/actions/clients";
import { getEmployees } from "@/actions/employees";
import { ReportsClient } from "@/components/ReportsClient";
import { ClientPortalDashboard } from "@/components/ClientPortalDashboard";

export default async function ReportsPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role || "EMPLOYEE";
  const currentEmployeeId = (session?.user as any)?.employeeId;

  // If user is a CLIENT, only load their own client record and render the dedicated Client Portal
  if (userRole === "CLIENT") {
    const clients = await getClients();
    const myClient = clients[0] || null;

    return (
      <ClientPortalDashboard
        client={myClient}
        user={session?.user}
      />
    );
  }

  const [reports, clientReports, clients, employees] = await Promise.all([
    getERPReports(),
    getClientReports(),
    getClients(),
    getEmployees(),
  ]);

  return (
    <ReportsClient
      reports={reports}
      clientReports={clientReports}
      initialClients={clients}
      employees={employees}
      userRole={userRole}
      currentEmployeeId={currentEmployeeId}
      user={session?.user}
    />
  );
}
