"use client";

import { createContext, useContext } from "react";
import type { QuoteWizardState, WizardStep } from "@/lib/quote-wizard/types";

export interface CatalogEquipment {
  id: string;
  name: string;
  brand: string;
  model: string;
  btu: number;
  type: string;
  price: number;
  active: boolean;
}

export interface CatalogKit {
  id: string;
  minMeters: number;
  maxMeters: number | null;
  price: number;
  active: boolean;
}

export interface CatalogComplexity {
  id: string;
  level: number;
  name: string;
  description: string;
  adjustment: number;
  active: boolean;
}

export interface QuoteWizardCatalogs {
  equipment: CatalogEquipment[];
  kits: CatalogKit[];
  complexities: CatalogComplexity[];
}

export interface QuoteWizardContextValue {
  state: QuoteWizardState;
  update: (patch: Partial<QuoteWizardState>) => void;
  goNext: () => void;
  goBack: () => void;
  catalogs: QuoteWizardCatalogs;
  loadingCatalogs: boolean;
  editQuoteId?: string;
}

export const QuoteWizardContext = createContext<QuoteWizardContextValue | null>(null);

export function useQuoteWizard() {
  const ctx = useContext(QuoteWizardContext);
  if (!ctx) throw new Error("useQuoteWizard debe usarse dentro de QuoteWizardProvider");
  return ctx;
}

export const STEP_ORDER: WizardStep[] = [
  "client",
  "area-count",
  "area",
  "extras",
  "deposit",
  "discount",
  "additional-description",
  "summary",
];
