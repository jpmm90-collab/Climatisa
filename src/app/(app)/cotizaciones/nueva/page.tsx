import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NuevaCotizacionPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="items-center text-center">
          <FilePlus2 className="size-10 text-muted-foreground" />
          <CardTitle>Crear cotización</CardTitle>
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
