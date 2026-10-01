import { auth } from "@/auth";
import { getAuditLogs } from "@/actions/reports";
import { SettingsClient } from "@/components/SettingsClient";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const logs = await getAuditLogs();

  return <SettingsClient logs={logs} />;
}
