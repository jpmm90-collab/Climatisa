"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { selectInstallationKit } from "@/lib/pricing/kit-selection";
import type { WizardEquipmentLine } from "@/lib/quote-wizard/types";

type SubStep = "equipment" | "details" | "complexity";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (line: WizardEquipmentLine) => void;
}

export function EquipmentLineDialog({ open, onOpenChange, onAdd }: Props) {
  const { catalogs } = useQuoteWizard();
  const [subStep, setSubStep] = useState<SubStep>("equipment");
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const [meters, setMeters] = useState("");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (open) {
      setSubStep("equipment");
      setEquipmentId(null);
      setMeters("");
      setQuantity("1");
    }
  }, [open]);

  const equipment = catalogs.equipment.find((e) => e.id === equipmentId) ?? null;
  const equipmentByType = groupBy(catalogs.equipment, (e) => e.type);

  const handleAddComplexity = (complexityId: string) => {
    const complexity = catalogs.complexities.find((c) => c.id === complexityId);
    if (!complexity || !equipment) return;

    const metersValue = Number(meters);
    const quantityValue = Math.max(1, Math.round(Number(quantity) || 1));

    let kit;
    try {
      kit = selectInstallationKit(metersValue, catalogs.kits);
    } catch {
      toast.error("No hay un kit de instalación configurado para esa distancia.");
      return;
    }

    onAdd({
      lineId: crypto.randomUUID(),
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      equipmentPrice: equipment.price,
      quantity: quantityValue,
      meters: metersValue,
      complexityId: complexity.id,
      complexityName: complexity.name,
      complexityAdjustment: complexity.adjustment,
      kitId: kit.id,
      kitPrice: kit.price,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {subStep === "equipment" ? (
          <>
            <DialogHeader>
              <DialogTitle>¿Qué equipo vamos a instalar?</DialogTitle>
              <DialogDescription>Elige el equipo de la lista.</DialogDescription>
            </DialogHeader>
            <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
              {Object.entries(equipmentByType).map(([type, items]) => (
                <div key={type} className="flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{type}</p>
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => {
                          setEquipmentId(item.id);
                          setSubStep("details");
                        }}
                      >
                        <CardContent className="py-3">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.btu.toLocaleString()} BTU</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              {catalogs.equipment.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay equipos activos configurados.</p>
              ) : null}
            </div>
          </>
        ) : null}

        {subStep === "details" && equipment ? (
          <>
            <DialogHeader>
              <DialogTitle>{equipment.name}</DialogTitle>
              <DialogDescription>¿Cuántos metros de instalación?</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="line-meters">Metros</FieldLabel>
                <Input
                  id="line-meters"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  autoFocus
                  value={meters}
                  onChange={(e) => setMeters(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="line-quantity">Cantidad de equipos iguales</FieldLabel>
                <Input
                  id="line-quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Field>
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" className="gap-1" onClick={() => setSubStep("equipment")}>
                  <ChevronLeft className="size-4" />
                  Atrás
                </Button>
                <Button
                  disabled={!meters || Number(meters) < 0}
                  onClick={() => setSubStep("complexity")}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {subStep === "complexity" ? (
          <>
            <DialogHeader>
              <DialogTitle>¿Qué tan complicada es la instalación?</DialogTitle>
              <DialogDescription>Elige el nivel que mejor describe el trabajo.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {catalogs.complexities.map((complexity) => (
                <Card
                  key={complexity.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => handleAddComplexity(complexity.id)}
                >
                  <CardContent className="py-3">
                    <p className="font-medium">
                      {complexity.level} — {complexity.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{complexity.description}</p>
                  </CardContent>
                </Card>
              ))}
              {catalogs.complexities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay complejidades activas configuradas.</p>
              ) : null}
            </div>
            <Button variant="ghost" className="w-fit gap-1" onClick={() => setSubStep("details")}>
              <ChevronLeft className="size-4" />
              Atrás
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}
