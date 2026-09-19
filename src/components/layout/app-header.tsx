import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/layout/logout-button";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  COTIZADOR: "Cotizador",
};

export async function AppHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-md items-center justify-between px-4 py-3"
        style={{ paddingTop: "env(safe-area-inset-top, 0.75rem)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/branding/climatisa-logo.png"
            alt="Climatisa"
            width={36}
            height={36}
            className="rounded-md"
            priority
          />
          <span className="text-base font-semibold">Climatisa</span>
        </Link>
        {session?.user ? (
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[session.user.role] ?? session.user.role}
              </p>
            </div>
            <LogoutButton />
          </div>
        ) : null}
      </div>
    </header>
  );
}
