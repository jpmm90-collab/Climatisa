"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";
import { TEXT_LIMITS } from "@/lib/constants";

export function StepAdditionalDescription() {
  const { state, update, goNext } = useQuoteWizard();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">¿Quieres agregar algo a la cotización?</h1>
        <p className="text-sm text-muted-foreground">
          Tiempo estimado, condiciones especiales, garantía, forma de pago... Es opcional.
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="additional-description">Observaciones</FieldLabel>
        <Textarea
          id="additional-description"
          rows={6}
          maxLength={TEXT_LIMITS.additionalDescription}
          value={state.additionalDescription}
          onChange={(e) => update({ additionalDescription: e.target.value })}
        />
        <FieldDescription>
          {state.additionalDescription.length}/{TEXT_LIMITS.additionalDescription}
        </FieldDescription>
      </Field>

      <Button size="lg" className="h-14 text-base" onClick={goNext}>
        Continuar
      </Button>

      <WizardBackButton />
    </div>
  );
}
