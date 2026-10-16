import { getSalesData } from "@/actions/sales";
import { SalesClient } from "@/components/SalesClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role;
  const dept = user?.department || "";

  if (role !== "ADMIN" && !dept.toLowerCase().includes("sales")) {
    redirect("/reports");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const month = resolvedParams.month ? Number(resolvedParams.month) : undefined;
  const year = resolvedParams.year ? Number(resolvedParams.year) : undefined;

  const salesData = await getSalesData({ month, year });
  return <SalesClient initialData={salesData} userRole={role} user={user} />;
}
