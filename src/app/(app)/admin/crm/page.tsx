import { getLeads } from "@/actions/crm";
import { getEmployees } from "@/actions/employees";
import { CRMClient } from "@/components/CRMClient";
import { auth } from "@/auth";

export default async function AdminCRMPage() {
  const session = await auth();
  const [leads, employees] = await Promise.all([
    getLeads(),
    getEmployees(),
  ]);

  return <CRMClient initialLeads={leads} employees={employees} user={session?.user} userRole="ADMIN" />;
}

