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
import { INITIAL_WIZARD_STATE, type QuoteWizardState, type WizardStep } from "@/lib/quote-wizard/types";
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

export function QuoteWizard({ editQuoteId }: { editQuoteId?: string }) {
  const [state, setState] = useState<QuoteWizardState>(
    () => loadWizardDraft(editQuoteId) ?? INITIAL_WIZARD_STATE,
  );
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
              step: editQuoteId ? "summary" : "area-count",
            }));
          }
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar la cotización existente cuando se edita, solo la primera vez
  // (si ya hay un borrador de edición en sessionStorage, se usa ese en su
  // lugar — el usuario puede estar regresando de "Crear cliente").
  useEffect(() => {
    if (!editQuoteId || hasWizardDraft(editQuoteId)) return;

    fetch(`/api/quotes/${editQuoteId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const quote = data?.quote;
        if (!quote) {
          toast.error("No se pudo cargar la cotización para editar.");
          return;
        }
        setState((prev) => ({
          ...prev,
          step: "summary",
          client: {
            id: quote.client.id,
            name: quote.client.name,
            phone: quote.client.phone,
            nit: quote.client.nit,
          },
          areaCount: quote.areas.length,
          currentAreaIndex: 0,
          areas: quote.areas.map((area: Record<string, unknown>) => ({
            areaId: crypto.randomUUID(),
            name: area.name as string,
            equipmentLines: (area.equipment as Record<string, unknown>[]).map((line) => ({
              lineId: crypto.randomUUID(),
              sourceLineId: line.id as string,
              equipmentId: line.equipmentId as string,
              equipmentName: line.equipmentNameSnapshot as string,
              equipmentPrice: line.equipmentPriceSnapshot as number,
              quantity: line.quantity as number,
              meters: line.meters as number,
              complexityId: line.complexityId as string,
              complexityName: "",
              complexityAdjustment: line.complexityAdjustmentSnapshot as number,
              kitId: line.installationKitId as string,
              kitPrice: line.installationKitPriceSnapshot as number,
            })),
          })),
          extras: quote.extras.map((extra: Record<string, unknown>) => ({
            extraId: crypto.randomUUID(),
            description: extra.description as string,
            price: extra.price as number,
          })),
          depositPercentage: quote.depositPercentage,
          discountType: quote.discountType,
          discountValue: quote.discountValue,
          additionalDescription: quote.additionalDescription ?? "",
          installationNotesExtra: quote.installationNotesExtra ?? "",
        }));
      })
      .catch(() => toast.error("No se pudo cargar la cotización para editar."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editQuoteId]);

  useEffect(() => {
    const wasFresh = !hasWizardDraft(editQuoteId);

    Promise.all([
      fetch("/api/equipment").then((r) => r.json()),
      fetch("/api/installation-kits").then((r) => r.json()),
      fetch("/api/complexities").then((r) => r.json()),
      fetch("/api/company-settings").then((r) => r.json()),
    ])
      .then(([equipmentRes, kitsRes, complexitiesRes, settingsRes]) => {
        // Las rutas /api/equipment, /api/installation-kits y /api/complexities
        // ya serializan los campos Decimal a number (ver src/lib/serializers.ts)
        // — no hay que volver a convertir aquí.
        const complexities = (complexitiesRes.complexities ?? []).filter(
          (c: { active: boolean }) => c.active,
        );
        setCatalogs({
          equipment: (equipmentRes.equipment ?? []).filter((e: { active: boolean }) => e.active),
          kits: (kitsRes.kits ?? []).filter((k: { active: boolean }) => k.active),
          complexities,
        });

        // Solo aplicar el porcentaje de anticipo por defecto en una
        // cotización NUEVA sin borrador previo — al editar, el porcentaje
        // ya guardado siempre gana.
        const defaultDeposit = settingsRes.settings?.defaultDepositPercentage;
        if (wasFresh && !editQuoteId && defaultDeposit != null) {
          setState((prev) => ({ ...prev, depositPercentage: defaultDeposit }));
        }

        // Completar el nombre de complejidad (solo para mostrar en las
        // tarjetas del asistente) en las líneas cargadas al editar — no
        // afecta el precio, que ya viene fijo en complexityAdjustment.
        if (complexities.length > 0) {
          setState((prev) => ({
            ...prev,
            areas: prev.areas.map((area) => ({
              ...area,
              equipmentLines: area.equipmentLines.map((line) =>
                line.complexityName
                  ? line
                  : {
                      ...line,
                      complexityName:
                        complexities.find((c: { id: string }) => c.id === line.complexityId)?.name ??
                        "",
                    },
              ),
            })),
          }));
        }
      })
      .catch(() => toast.error("No se pudieron cargar los catálogos. Intenta de nuevo."))
      .finally(() => setLoadingCatalogs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveWizardDraft(state, editQuoteId);
  }, [state, editQuoteId]);

  const update = (patch: Partial<QuoteWizardState>) => setState((prev) => ({ ...prev, ...patch }));

  const goNext = () => setState((prev) => ({ ...prev, step: nextStep(prev) }));
  const goBack = () => setState((prev) => ({ ...prev, step: previousStep(prev) }));

  const value: QuoteWizardContextValue = {
    state,
    update,
    goNext,
    goBack,
    catalogs,
    loadingCatalogs,
    editQuoteId,
  };

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

export function resetWizard(editQuoteId?: string) {
  clearWizardDraft(editQuoteId);
}
