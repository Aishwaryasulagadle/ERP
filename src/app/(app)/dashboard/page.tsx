import { auth } from "@/auth";
import { getDashboardMetrics } from "@/actions/dashboard";
import { DashboardClient } from "@/components/DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "EMPLOYEE";

  if (role === "CLIENT") {
    redirect("/reports");
  }

  const metrics = await getDashboardMetrics();
  return <DashboardClient metrics={metrics} user={session?.user} role={role} />;
}

