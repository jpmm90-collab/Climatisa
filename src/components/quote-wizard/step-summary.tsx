"use client";

import { useRouter } from "next/navigation";
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

  const startOver = () => {
    resetWizard();
    router.refresh();
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="text-sm text-muted-foreground">
          Vista previa de la cotización. Generarla y crear el PDF llega en la siguiente etapa.
        </p>
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

      <WizardBackButton />
      <Button variant="ghost" className="text-muted-foreground" onClick={startOver}>
        Cancelar y empezar de nuevo
      </Button>
    </div>
  );
}
