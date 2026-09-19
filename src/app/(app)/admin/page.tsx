import Link from "next/link";
import { redirect } from "next/navigation";
import { AirVent, Ruler, Gauge } from "lucide-react";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const session = await getSession();

  if (session?.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Administración</h1>
        <p className="text-sm text-muted-foreground">Precios y catálogos del sistema.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild size="lg" variant="secondary" className="h-16 justify-start gap-3 text-base">
          <Link href="/admin/equipos">
            <AirVent className="size-6" />
            Equipos
          </Link>
        </Button>

        <Button asChild size="lg" variant="secondary" className="h-16 justify-start gap-3 text-base">
          <Link href="/admin/kits">
            <Ruler className="size-6" />
            Kits de instalación
          </Link>
        </Button>

        <Button asChild size="lg" variant="secondary" className="h-16 justify-start gap-3 text-base">
          <Link href="/admin/complejidades">
            <Gauge className="size-6" />
            Complejidades
          </Link>
        </Button>
      </div>
    </div>
  );
}
