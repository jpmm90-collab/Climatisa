import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell } from "@/components/layout/mobile-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <MobileShell>{children}</MobileShell>
    </div>
  );
}
