import { getLeads } from "@/actions/crm";
import { getEmployees } from "@/actions/employees";
import { CRMClient } from "@/components/CRMClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CRMPage() {
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role;
  const dept = user?.department || "";

  if (role !== "ADMIN" && !dept.toLowerCase().includes("sales")) {
    redirect("/reports");
  }

  const [leads, employees] = await Promise.all([
    getLeads(),
    getEmployees(),
  ]);

  return <CRMClient initialLeads={leads} employees={employees} user={user} userRole={role} />;
}
