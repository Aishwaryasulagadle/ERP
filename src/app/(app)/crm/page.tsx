import { getLeads } from "@/actions/crm";
import { getEmployees } from "@/actions/employees";
import { CRMClient } from "@/components/CRMClient";

export default async function CRMPage() {
  const [leads, employees] = await Promise.all([
    getLeads(),
    getEmployees(),
  ]);

  return <CRMClient initialLeads={leads} employees={employees} />;
}
