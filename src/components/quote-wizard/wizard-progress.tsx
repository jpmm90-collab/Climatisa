"use client";

import { useQuoteWizard } from "@/components/quote-wizard/context";

const STEP_LABELS: Record<string, string> = {
  client: "Cliente",
  "area-count": "Áreas",
  area: "Área",
  extras: "Extras",
  deposit: "Anticipo",
  discount: "Descuento",
  "additional-description": "Observaciones",
  summary: "Resumen",
};

export function WizardProgress() {
  const { state } = useQuoteWizard();

  const label =
    state.step === "area" && state.areaCount
      ? `Área ${state.currentAreaIndex + 1} de ${state.areaCount}`
      : STEP_LABELS[state.step];

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progressPercent(state.step)}%` }}
        />
      </div>
    </div>
  );
}

function progressPercent(step: string): number {
  const order = ["client", "area-count", "area", "extras", "deposit", "discount", "additional-description", "summary"];
  const index = order.indexOf(step);
  if (index < 0) return 0;
  return Math.round(((index + 1) / order.length) * 100);
}
