"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  QuoteWizardContext,
  type QuoteWizardCatalogs,
  type QuoteWizardContextValue,
} from "@/components/quote-wizard/context";
import {
  clearWizardDraft,
  consumePendingSelectedClientId,
  hasWizardDraft,
  loadWizardDraft,
  saveWizardDraft,
} from "@/lib/quote-wizard/storage";
import type { QuoteWizardState, WizardStep } from "@/lib/quote-wizard/types";
import { StepClient } from "@/components/quote-wizard/step-client";
import { StepAreaCount } from "@/components/quote-wizard/step-area-count";
import { StepArea } from "@/components/quote-wizard/step-area";
import { StepExtras } from "@/components/quote-wizard/step-extras";
import { StepDeposit } from "@/components/quote-wizard/step-deposit";
import { StepDiscount } from "@/components/quote-wizard/step-discount";
import { StepAdditionalDescription } from "@/components/quote-wizard/step-additional-description";
import { StepSummary } from "@/components/quote-wizard/step-summary";
import { WizardProgress } from "@/components/quote-wizard/wizard-progress";

const EMPTY_CATALOGS: QuoteWizardCatalogs = { equipment: [], kits: [], complexities: [] };

export function QuoteWizard() {
  const [state, setState] = useState<QuoteWizardState>(() => loadWizardDraft());
  const [catalogs, setCatalogs] = useState<QuoteWizardCatalogs>(EMPTY_CATALOGS);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  useEffect(() => {
    const pendingClientId = consumePendingSelectedClientId();
    if (pendingClientId) {
      fetch(`/api/clients/${pendingClientId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.client) {
            setState((prev) => ({
              ...prev,
              client: {
                id: data.client.id,
                name: data.client.name,
                phone: data.client.phone,
                nit: data.client.nit,
              },
              step: "area-count",
            }));
          }
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wasFresh = !hasWizardDraft();

    Promise.all([
      fetch("/api/equipment").then((r) => r.json()),
      fetch("/api/installation-kits").then((r) => r.json()),
      fetch("/api/complexities").then((r) => r.json()),
      fetch("/api/company-settings").then((r) => r.json()),
    ])
      .then(([equipmentRes, kitsRes, complexitiesRes, settingsRes]) => {
        // Prisma serializa los campos Decimal como string en JSON — convertir
        // a number aquí, igual que en las pantallas de administración.
        setCatalogs({
          equipment: (equipmentRes.equipment ?? [])
            .filter((e: { active: boolean }) => e.active)
            .map((e: { price: string }) => ({ ...e, price: Number(e.price) })),
          kits: (kitsRes.kits ?? [])
            .filter((k: { active: boolean }) => k.active)
            .map((k: { minMeters: string; maxMeters: string | null; price: string }) => ({
              ...k,
              minMeters: Number(k.minMeters),
              maxMeters: k.maxMeters === null ? null : Number(k.maxMeters),
              price: Number(k.price),
            })),
          complexities: (complexitiesRes.complexities ?? [])
            .filter((c: { active: boolean }) => c.active)
            .map((c: { adjustment: string }) => ({ ...c, adjustment: Number(c.adjustment) })),
        });

        const defaultDeposit = settingsRes.settings?.defaultDepositPercentage;
        if (wasFresh && defaultDeposit != null) {
          setState((prev) => ({ ...prev, depositPercentage: Number(defaultDeposit) }));
        }
      })
      .catch(() => toast.error("No se pudieron cargar los catálogos. Intenta de nuevo."))
      .finally(() => setLoadingCatalogs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveWizardDraft(state);
  }, [state]);

  const update = (patch: Partial<QuoteWizardState>) => setState((prev) => ({ ...prev, ...patch }));

  const goNext = () => setState((prev) => ({ ...prev, step: nextStep(prev) }));
  const goBack = () => setState((prev) => ({ ...prev, step: previousStep(prev) }));

  const value: QuoteWizardContextValue = { state, update, goNext, goBack, catalogs, loadingCatalogs };

  return (
    <QuoteWizardContext.Provider value={value}>
      <div className="flex flex-col gap-4">
        <WizardProgress />
        <StepRouter step={state.step} />
      </div>
    </QuoteWizardContext.Provider>
  );
}

function StepRouter({ step }: { step: WizardStep }) {
  switch (step) {
    case "client":
      return <StepClient />;
    case "area-count":
      return <StepAreaCount />;
    case "area":
      return <StepArea />;
    case "extras":
      return <StepExtras />;
    case "deposit":
      return <StepDeposit />;
    case "discount":
      return <StepDiscount />;
    case "additional-description":
      return <StepAdditionalDescription />;
    case "summary":
      return <StepSummary />;
    default:
      return null;
  }
}

function nextStep(state: QuoteWizardState): WizardStep {
  switch (state.step) {
    case "client":
      return "area-count";
    case "area-count":
      return "area";
    case "area":
      return "extras";
    case "extras":
      return "deposit";
    case "deposit":
      return "discount";
    case "discount":
      return "additional-description";
    case "additional-description":
      return "summary";
    case "summary":
      return "summary";
  }
}

function previousStep(state: QuoteWizardState): WizardStep {
  switch (state.step) {
    case "client":
      return "client";
    case "area-count":
      return "client";
    case "area":
      return "area-count";
    case "extras":
      return "area";
    case "deposit":
      return "extras";
    case "discount":
      return "deposit";
    case "additional-description":
      return "discount";
    case "summary":
      return "additional-description";
  }
}

export function resetWizard() {
  clearWizardDraft();
}
