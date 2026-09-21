import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { toNumber } from "@/lib/decimal";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
};

export default async function BuscarCotizacionPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const quotes = await prisma.quote.findMany({
    where: query
      ? {
          OR: [
            { quoteNumber: { contains: query, mode: "insensitive" } },
            { client: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { client: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Buscar cotización</h1>
        <p className="text-sm text-muted-foreground">Busca por número de cotización o cliente.</p>
      </div>

      <form action="/cotizaciones/buscar" method="GET" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="COT-2026-000123 o nombre del cliente"
            className="pl-9"
          />
        </div>
        <Button type="submit" size="icon" variant="secondary" aria-label="Buscar">
          <Search className="size-4" />
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {quotes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {query ? "No se encontraron cotizaciones." : "Todavía no hay cotizaciones."}
          </p>
        ) : (
          quotes.map((quote) => (
            <Link key={quote.id} href={`/cotizaciones/${quote.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col gap-1 py-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{quote.quoteNumber}</p>
                    <Badge variant={quote.status === "DRAFT" ? "secondary" : "default"}>
                      {STATUS_LABELS[quote.status] ?? quote.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{quote.client.name}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatDate(quote.date)}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(toNumber(quote.total))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
