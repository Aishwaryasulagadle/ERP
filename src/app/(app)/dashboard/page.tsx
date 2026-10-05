import { auth } from "@/auth";
import { getDashboardMetrics } from "@/actions/dashboard";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "EMPLOYEE";

  const metrics = await getDashboardMetrics();
  return <DashboardClient metrics={metrics} user={session?.user} role={role} />;
}

