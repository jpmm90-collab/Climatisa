import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeQuote } from "@/lib/serializers";
import { formatCurrency, formatDate } from "@/lib/format";
import { VENDEDOR_RESPONSABLE } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
};

export default async function VerCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const record = await prisma.quote.findUnique({
    where: { id },
    include: { client: true, areas: { include: { equipment: true } }, extras: true },
  });

  if (!record) {
    notFound();
  }

  const quote = serializeQuote(record);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{quote.quoteNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(quote.date)}</p>
        </div>
        <Badge>{STATUS_LABELS[quote.status] ?? quote.status}</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1 py-4">
          <p className="font-medium">{quote.client.name}</p>
          <p className="text-sm text-muted-foreground">Tel. {quote.client.phone}</p>
          <p className="text-sm text-muted-foreground">NIT: {quote.client.nit}</p>
          <p className="text-sm text-muted-foreground">Vendedor: {VENDEDOR_RESPONSABLE}</p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {quote.areas.map((area) => (
          <Card key={area.id}>
            <CardContent className="flex flex-col gap-2 py-4">
              <p className="font-medium">{area.name}</p>
              {area.equipment.map((line) => (
                <div key={line.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {line.equipmentNameSnapshot}
                    {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                  </span>
                  <span>{formatCurrency(line.lineTotal)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span>Total área</span>
                <span>{formatCurrency(area.areaTotal)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {quote.extras.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="font-medium">Extras</p>
            {quote.extras.map((extra) => (
              <div key={extra.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{extra.description}</span>
                <span>{formatCurrency(extra.price)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {quote.additionalDescription ? (
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="font-medium">Observaciones</p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {quote.additionalDescription}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-1 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(quote.subtotal)}</span>
          </div>
          {quote.discountAmount > 0 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Descuento</span>
              <span>- {formatCurrency(quote.discountAmount)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-xl font-semibold">
            <span>Total</span>
            <span>{formatCurrency(quote.total)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex items-center justify-between text-sm">
            <span>Anticipo ({Number(quote.depositPercentage)}%)</span>
            <span>{formatCurrency(quote.depositAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Saldo</span>
            <span>{formatCurrency(quote.balance)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
