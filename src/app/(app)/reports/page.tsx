import { getERPReports } from "@/actions/reports";
import { ReportsClient } from "@/components/ReportsClient";

export default async function ReportsPage() {
  const reports = await getERPReports();
  return <ReportsClient reports={reports} />;
}
