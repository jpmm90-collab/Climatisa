"use client";

import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";
import { EquipmentLineDialog } from "@/components/quote-wizard/equipment-line-dialog";
import { calculateLineTotal } from "@/lib/pricing/engine";
import { formatCurrency } from "@/lib/format";
import type { WizardArea } from "@/lib/quote-wizard/types";

export function StepArea() {
  const { state, update } = useQuoteWizard();
  const [dialogOpen, setDialogOpen] = useState(false);

  const area = state.areas[state.currentAreaIndex];
  if (!area) return null;

  const updateArea = (patch: Partial<WizardArea>) => {
    const areas = [...state.areas];
    areas[state.currentAreaIndex] = { ...area, ...patch };
    update({ areas });
  };

  const removeLine = (lineId: string) => {
    updateArea({ equipmentLines: area.equipmentLines.filter((line) => line.lineId !== lineId) });
  };

  const canContinue = area.name.trim().length > 0 && area.equipmentLines.length > 0;

  const goToArea = (index: number) => update({ currentAreaIndex: index, step: "area" });

  const handleBack = () => {
    if (state.currentAreaIndex > 0) {
      goToArea(state.currentAreaIndex - 1);
    } else {
      update({ step: "area-count" });
    }
  };

  const handleNext = () => {
    if (!canContinue) return;
    const isLast = state.currentAreaIndex >= (state.areaCount ?? 1) - 1;
    if (isLast) {
      update({ step: "extras" });
    } else {
      goToArea(state.currentAreaIndex + 1);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          Área {state.currentAreaIndex + 1} de {state.areaCount}
        </h1>
        <p className="text-sm text-muted-foreground">Nombre del área y equipos a instalar.</p>
      </div>

      <Field>
        <FieldLabel htmlFor="area-name">Nombre del área</FieldLabel>
        <Input
          id="area-name"
          autoFocus
          placeholder="Habitación principal, Sala, Oficina..."
          value={area.name}
          onChange={(e) => updateArea({ name: e.target.value })}
        />
      </Field>

      <div className="flex flex-col gap-2">
        {area.equipmentLines.map((line) => {
          const totals = calculateLineTotal({
            equipmentPrice: line.equipmentPrice,
            quantity: line.quantity,
            kitPrice: line.kitPrice,
            complexityAdjustment: line.complexityAdjustment,
          });
          return (
            <Card key={line.lineId}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">
                    {line.equipmentName}
                    {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {line.meters} m · {line.complexityName}
                  </p>
                  <p className="text-sm font-medium">{formatCurrency(totals.lineTotal)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar equipo"
                  onClick={() => removeLine(line.lineId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button variant="secondary" size="lg" className="h-14 gap-2 text-base" onClick={() => setDialogOpen(true)}>
        <Plus className="size-5" />
        Agregar equipo
      </Button>

      <EquipmentLineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={(line) => updateArea({ equipmentLines: [...area.equipmentLines, line] })}
      />

      <Button size="lg" className="h-14 gap-2 text-base" disabled={!canContinue} onClick={handleNext}>
        <Check className="size-5" />
        Área lista
      </Button>
      {!canContinue ? (
        <p className="text-center text-sm text-muted-foreground">
          Ingresa un nombre y agrega al menos un equipo para continuar.
        </p>
      ) : null}

      <WizardBackButton onClick={handleBack} />
    </div>
  );
}
