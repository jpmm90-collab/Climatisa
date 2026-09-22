import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell } from "@/components/layout/mobile-shell";

// Todas las rutas bajo este layout dependen de la sesión (next-auth
// getServerSession) y, la mayoría, de datos en tiempo real de la base. La
// detección implícita de Next de "esta ruta usa una API dinámica, no la
// prerenderices" no es fiable con getServerSession de next-auth v4 en App
// Router (gap conocido) — en vez de arriesgarse a que el build intente
// prerenderizar esto de forma estática, se declara explícito para toda la
// sección autenticada de una sola vez.
export const dynamic = "force-dynamic";

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
