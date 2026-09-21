"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";
import { deriveQuote } from "@/lib/quote-wizard/derive";
import { formatCurrency } from "@/lib/format";

export function StepDiscount() {
  const { state, update, goNext } = useQuoteWizard();

  const totals = deriveQuote(state);
  const subtotalBeforeDiscount = totals.subtotal;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">¿Hay descuento?</h1>
        <p className="text-sm text-muted-foreground">Puedes dejarlo en cero si no aplica.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={state.discountType === "PERCENTAGE" ? "default" : "secondary"}
          className="h-12"
          onClick={() => update({ discountType: "PERCENTAGE" })}
        >
          Porcentaje
        </Button>
        <Button
          variant={state.discountType === "AMOUNT" ? "default" : "secondary"}
          className="h-12"
          onClick={() => update({ discountType: "AMOUNT" })}
        >
          Monto (Q)
        </Button>
      </div>

      <Field>
        <FieldLabel htmlFor="discount-value">
          {state.discountType === "PERCENTAGE" ? "Descuento (%)" : "Descuento (Q)"}
        </FieldLabel>
        <Input
          id="discount-value"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          className="h-14 text-center text-2xl font-semibold"
          value={state.discountValue}
          onChange={(e) => update({ discountValue: Math.max(0, Number(e.target.value) || 0) })}
        />
      </Field>

      <Card>
        <CardContent className="flex flex-col gap-1 py-4">
          <Row label="Total antes del descuento" value={formatCurrency(subtotalBeforeDiscount)} />
          <Row label="Descuento" value={`- ${formatCurrency(totals.discountAmount)}`} />
          <Row label="Total final" value={formatCurrency(totals.total)} emphasis />
        </CardContent>
      </Card>

      <Button size="lg" className="h-14 text-base" onClick={goNext}>
        Continuar
      </Button>

      <WizardBackButton />
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${emphasis ? "text-lg font-semibold" : "text-sm text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={emphasis ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}
