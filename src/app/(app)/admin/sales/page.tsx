import { getSalesData } from "@/actions/sales";
import { SalesClient } from "@/components/SalesClient";

export default async function AdminSalesPage() {
  const salesData = await getSalesData();
  return <SalesClient initialData={salesData} />;
}
