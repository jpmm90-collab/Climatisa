import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClientForm } from "./client-form";

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Crear cliente</h1>
        <p className="text-sm text-muted-foreground">Completa los datos del cliente.</p>
      </div>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Datos del cliente</CardTitle>
          <CardDescription>Nombre, teléfono, empresa, NIT y dirección.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm returnTo={returnTo && returnTo.startsWith("/") ? returnTo : "/"} />
        </CardContent>
      </Card>
    </div>
  );
}
