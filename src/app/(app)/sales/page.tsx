import { getSalesData } from "@/actions/sales";
import { SalesClient } from "@/components/SalesClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SalesPage() {
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role;
  const dept = user?.department || "";

  if (role !== "ADMIN" && !dept.toLowerCase().includes("sales")) {
    redirect("/reports");
  }

  const salesData = await getSalesData();
  return <SalesClient initialData={salesData} userRole={role} user={user} />;
}
