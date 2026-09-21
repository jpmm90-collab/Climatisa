"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";
import { resetWizard } from "@/components/quote-wizard/quote-wizard";
import { deriveQuote } from "@/lib/quote-wizard/derive";
import { formatCurrency } from "@/lib/format";
import { VENDEDOR_RESPONSABLE } from "@/lib/constants";

export function StepSummary() {
  const { state } = useQuoteWizard();
  const router = useRouter();
  const quote = deriveQuote(state);
  const [generating, setGenerating] = useState(false);

  const startOver = () => {
    resetWizard();
    router.refresh();
    window.location.reload();
  };

  const generate = async () => {
    if (!state.client) return;
    setGenerating(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: state.client.id,
          areas: state.areas.map((area) => ({
            name: area.name,
            equipmentLines: area.equipmentLines.map((line) => ({
              equipmentId: line.equipmentId,
              quantity: line.quantity,
              meters: line.meters,
              complexityId: line.complexityId,
            })),
          })),
          extras: state.extras.map((extra) => ({ description: extra.description, price: extra.price })),
          discountType: state.discountType,
          discountValue: state.discountValue,
          depositPercentage: state.depositPercentage,
          additionalDescription: state.additionalDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(data?.error ?? "No se pudo generar la cotización. Tus datos siguen aquí, intenta de nuevo.");
        return;
      }

      const { quote: created } = await response.json();
      resetWizard();
      toast.success(`Cotización ${created.quoteNumber} generada`);
      router.push(`/cotizaciones/${created.id}`);
    } catch {
      // Sin conexión, tiempo de espera agotado, etc. — el borrador NO se
      // borra (solo se limpia tras una respuesta exitosa del servidor), así
      // que los datos ya ingresados no se pierden. Avisar claramente en vez
      // de fallar en silencio (skill, sección PWA: "si no hay conexión,
      // decirlo claramente").
      toast.error("No se pudo conectar. Revisa tu conexión e intenta de nuevo — no perdiste nada.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="text-sm text-muted-foreground">Revisa todo antes de generar la cotización.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1 py-4">
          <p className="font-medium">{state.client?.name}</p>
          <p className="text-sm text-muted-foreground">Tel. {state.client?.phone}</p>
          <p className="text-sm text-muted-foreground">NIT: {state.client?.nit}</p>
          <p className="text-sm text-muted-foreground">Vendedor: {VENDEDOR_RESPONSABLE}</p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {quote.areas.map((area) => (
          <Card key={area.areaId}>
            <CardContent className="flex flex-col gap-2 py-4">
              <p className="font-medium">{area.name}</p>
              {area.lines.map((line, index) => {
                const source = state.areas.find((a) => a.areaId === area.areaId)?.equipmentLines[index];
                return (
                  <div key={line.lineId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {source?.equipmentName}
                      {source && source.quantity > 1 ? ` × ${source.quantity}` : ""}
                    </span>
                    <span>{formatCurrency(line.lineTotal)}</span>
                  </div>
                );
              })}
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span>Total área</span>
                <span>{formatCurrency(area.areaTotal)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {state.extras.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="font-medium">Extras</p>
            {state.extras.map((extra) => (
              <div key={extra.extraId} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{extra.description}</span>
                <span>{formatCurrency(extra.price)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {state.additionalDescription ? (
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="font-medium">Observaciones</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.additionalDescription}</p>
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
            <span>Anticipo ({state.depositPercentage}%)</span>
            <span>{formatCurrency(quote.depositAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Saldo</span>
            <span>{formatCurrency(quote.balance)}</span>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="h-14 gap-2 text-base" disabled={generating} onClick={generate}>
        <Send className="size-5" />
        {generating ? "Generando..." : "Generar cotización"}
      </Button>

      <WizardBackButton />
      <Button variant="ghost" className="text-muted-foreground" onClick={startOver}>
        Cancelar y empezar de nuevo
      </Button>
    </div>
  );
}
