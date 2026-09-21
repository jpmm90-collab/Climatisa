"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { FieldCharCount } from "@/components/ui/field-char-count";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";
import { TEXT_LIMITS } from "@/lib/constants";

export function StepAdditionalDescription() {
  const { state, update, goNext } = useQuoteWizard();
  const overLimit = state.additionalDescription.length > TEXT_LIMITS.additionalDescription;

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
          value={state.additionalDescription}
          onChange={(e) => update({ additionalDescription: e.target.value })}
        />
        <FieldCharCount value={state.additionalDescription} limit={TEXT_LIMITS.additionalDescription} />
        {overLimit ? <FieldError>Acorta el texto antes de continuar.</FieldError> : null}
      </Field>

      <Button size="lg" className="h-14 text-base" disabled={overLimit} onClick={goNext}>
        Continuar
      </Button>

      <WizardBackButton />
    </div>
  );
}
