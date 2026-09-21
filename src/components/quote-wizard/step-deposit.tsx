"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";

export function StepDeposit() {
  const { state, update, goNext } = useQuoteWizard();

  const isValid = state.depositPercentage >= 0 && state.depositPercentage <= 100;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">¿Cuánto anticipo se solicitará?</h1>
        <p className="text-sm text-muted-foreground">Porcentaje del total de la cotización.</p>
      </div>

      <Field>
        <FieldLabel htmlFor="deposit">Anticipo (%)</FieldLabel>
        <div className="relative">
          <Input
            id="deposit"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            autoFocus
            className="h-16 pr-10 text-center text-3xl font-semibold"
            value={state.depositPercentage}
            onChange={(e) => update({ depositPercentage: Number(e.target.value) })}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
            %
          </span>
        </div>
        {!isValid ? <FieldError>El anticipo debe estar entre 0% y 100%.</FieldError> : null}
      </Field>

      <Button size="lg" className="h-14 text-base" disabled={!isValid} onClick={goNext}>
        Continuar
      </Button>

      <WizardBackButton />
    </div>
  );
}
