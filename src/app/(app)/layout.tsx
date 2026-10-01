import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getNotifications } from "@/actions/reports";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const notifications = await getNotifications();

  return (
    <AppShell user={session.user} notifications={notifications}>
      {children}
    </AppShell>
  );
}
