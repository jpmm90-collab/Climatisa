"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { FieldCharCount } from "@/components/ui/field-char-count";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";
import { TEXT_LIMITS } from "@/lib/constants";

// Solo para quoteType === "CENTO" (extensión confirmada al skill, ver
// CLAUDE.md). Reemplaza la búsqueda/creación de cliente: el cliente ya
// quedó fijo desde el paso anterior, aquí solo se piden los dos datos de
// texto libre obligatorios de esta cotización.
export function StepCentoInfo() {
  const { state, update } = useQuoteWizard();

  const vendorOverLimit = state.centoVendorName.length > TEXT_LIMITS.centoVendorName;
  const referenceOverLimit = state.centoClientReference.length > TEXT_LIMITS.centoClientReference;
  const canContinue =
    state.centoVendorName.trim().length > 0 &&
    state.centoClientReference.trim().length > 0 &&
    !vendorOverLimit &&
    !referenceOverLimit;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Datos de Cento</h1>
        <p className="text-sm text-muted-foreground">
          El cliente de esta cotización es {state.client?.name ?? "Cento"}.
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="cento-vendor-name">Vendedor de Cento</FieldLabel>
        <Input
          id="cento-vendor-name"
          autoFocus
          placeholder="Nombre de quien lleva la venta en Cento"
          value={state.centoVendorName}
          onChange={(e) => update({ centoVendorName: e.target.value })}
        />
        <FieldCharCount value={state.centoVendorName} limit={TEXT_LIMITS.centoVendorName} />
      </Field>

      <Field>
        <FieldLabel htmlFor="cento-client-reference">Referencia del cliente final</FieldLabel>
        <Textarea
          id="cento-client-reference"
          rows={2}
          placeholder="Nombre o referencia del cliente final de Cento (no un registro completo)"
          value={state.centoClientReference}
          onChange={(e) => update({ centoClientReference: e.target.value })}
        />
        <FieldCharCount value={state.centoClientReference} limit={TEXT_LIMITS.centoClientReference} />
      </Field>

      <Button
        size="lg"
        className="h-14 text-base"
        disabled={!canContinue}
        onClick={() => update({ step: "area-count" })}
      >
        Continuar
      </Button>
      {!canContinue ? (
        <p className="text-center text-sm text-muted-foreground">
          Completa ambos campos para continuar.
        </p>
      ) : null}

      <WizardBackButton />
    </div>
  );
}
