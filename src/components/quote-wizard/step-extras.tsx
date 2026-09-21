"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";
import { formatCurrency } from "@/lib/format";
import { TEXT_LIMITS } from "@/lib/constants";

export function StepExtras() {
  const { state, update, goNext } = useQuoteWizard();
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const addExtra = () => {
    const trimmed = description.trim();
    const priceValue = Number(price);
    if (!trimmed || !Number.isFinite(priceValue) || priceValue < 0) return;

    update({
      extras: [...state.extras, { extraId: crypto.randomUUID(), description: trimmed, price: priceValue }],
    });
    setDescription("");
    setPrice("");
  };

  const removeExtra = (extraId: string) => {
    update({ extras: state.extras.filter((extra) => extra.extraId !== extraId) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">¿Hay algún trabajo adicional?</h1>
        <p className="text-sm text-muted-foreground">
          Pintura, canaletas u otro trabajo fuera de la instalación estándar.
        </p>
      </div>

      {state.extras.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay extras agregados.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {state.extras.map((extra) => (
            <Card key={extra.extraId}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{extra.description}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(extra.price)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar extra"
                  onClick={() => removeExtra(extra.extraId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <Field>
            <FieldLabel htmlFor="extra-description">Descripción</FieldLabel>
            <Input
              id="extra-description"
              placeholder="Canaleta especial"
              maxLength={TEXT_LIMITS.extraDescription}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="extra-price">Precio (Q)</FieldLabel>
            <Input
              id="extra-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={addExtra}
            disabled={!description.trim() || !price}
          >
            <Plus className="size-4" />
            Agregar otro
          </Button>
        </CardContent>
      </Card>

      <Button size="lg" className="h-14 text-base" onClick={goNext}>
        Continuar
      </Button>

      <WizardBackButton />
    </div>
  );
}
