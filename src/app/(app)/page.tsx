import Link from "next/link";
import { FilePlus2, Search, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">¿Qué vamos a hacer?</h1>
        <p className="text-sm text-muted-foreground">Elige una opción para continuar.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="h-16 justify-start gap-3 text-base">
          <Link href="/cotizaciones/nueva">
            <FilePlus2 className="size-6" />
            Crear cotización
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="secondary"
          className="h-16 justify-start gap-3 text-base"
        >
          <Link href="/cotizaciones/buscar">
            <Search className="size-6" />
            Buscar cotización
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="secondary"
          className="h-16 justify-start gap-3 text-base"
        >
          <Link href="/clientes/nuevo">
            <UserPlus className="size-6" />
            Crear cliente
          </Link>
        </Button>
      </div>

      <Link
        href="/clientes"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        <Users className="size-4" />
        Ver clientes
      </Link>
    </div>
  );
}
