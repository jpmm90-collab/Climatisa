"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";
import type { WizardArea } from "@/lib/quote-wizard/types";

const QUICK_COUNTS = [1, 2, 3, 4, 5];

function resizeAreas(areas: WizardArea[], count: number): WizardArea[] {
  const resized = [...areas];
  while (resized.length < count) {
    resized.push({ areaId: crypto.randomUUID(), name: "", equipmentLines: [] });
  }
  return resized.slice(0, count);
}

export function StepAreaCount() {
  const { state, update } = useQuoteWizard();
  const [manualValue, setManualValue] = useState(
    state.areaCount && !QUICK_COUNTS.includes(state.areaCount) ? String(state.areaCount) : "",
  );

  const choose = (count: number) => {
    if (!Number.isInteger(count) || count < 1) return;
    update({
      areaCount: count,
      areas: resizeAreas(state.areas, count),
      currentAreaIndex: 0,
      step: "area",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">¿Cuántas áreas vamos a cotizar?</h1>
        <p className="text-sm text-muted-foreground">Cada área es un espacio con su propio equipo.</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {QUICK_COUNTS.map((count) => (
          <Button
            key={count}
            variant={state.areaCount === count ? "default" : "secondary"}
            className="h-16 text-lg"
            onClick={() => choose(count)}
          >
            {count}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Otro número"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          className="h-12"
        />
        <Button
          variant="secondary"
          className="h-12"
          onClick={() => choose(Number(manualValue))}
          disabled={!manualValue}
        >
          Usar
        </Button>
      </div>

      <WizardBackButton />
    </div>
  );
}
