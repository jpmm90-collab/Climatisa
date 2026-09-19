import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const clients = await prisma.client.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { nit: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Busca un cliente o crea uno nuevo.</p>
      </div>

      <form action="/clientes" method="GET" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Nombre, teléfono, empresa o NIT"
            className="pl-9"
          />
        </div>
        <Button type="submit" size="icon" variant="secondary" aria-label="Buscar">
          <Search className="size-4" />
        </Button>
      </form>

      <Button asChild size="lg" className="h-14 gap-2 text-base">
        <Link href="/clientes/nuevo">
          <UserPlus className="size-5" />
          Crear cliente
        </Link>
      </Button>

      <div className="flex flex-col gap-3">
        {clients.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {query ? "No se encontraron clientes." : "Todavía no hay clientes."}
          </p>
        ) : (
          clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="flex flex-col gap-1 py-4">
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.company}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{client.phone}</span>
                  <span>NIT: {client.nit}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
