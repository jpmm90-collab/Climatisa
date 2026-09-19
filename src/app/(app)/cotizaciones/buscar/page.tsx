import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function BuscarCotizacionPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="items-center text-center">
          <Search className="size-10 text-muted-foreground" />
          <CardTitle>Buscar cotización</CardTitle>
          <CardDescription>
            Esta parte del sistema todavía no está disponible. Se habilitará en una
            próxima etapa del proyecto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
