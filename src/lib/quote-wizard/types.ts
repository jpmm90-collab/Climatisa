import type { DiscountType } from "@/lib/pricing/engine";

export interface WizardClient {
  id: string;
  name: string;
  phone: string;
  nit: string;
}

export interface WizardEquipmentLine {
  lineId: string;
  equipmentId: string;
  equipmentName: string;
  equipmentPrice: number;
  quantity: number;
  meters: number;
  complexityId: string;
  complexityName: string;
  complexityAdjustment: number;
  kitId: string;
  kitPrice: number;
}

export interface WizardArea {
  areaId: string;
  name: string;
  equipmentLines: WizardEquipmentLine[];
}

export interface WizardExtra {
  extraId: string;
  description: string;
  price: number;
}

export type WizardStep =
  | "client"
  | "area-count"
  | "area"
  | "extras"
  | "deposit"
  | "discount"
  | "additional-description"
  | "summary";

export interface QuoteWizardState {
  step: WizardStep;
  client: WizardClient | null;
  areaCount: number | null;
  currentAreaIndex: number;
  areas: WizardArea[];
  extras: WizardExtra[];
  depositPercentage: number;
  discountType: DiscountType;
  discountValue: number;
  additionalDescription: string;
}

export const INITIAL_WIZARD_STATE: QuoteWizardState = {
  step: "client",
  client: null,
  areaCount: null,
  currentAreaIndex: 0,
  areas: [],
  extras: [],
  depositPercentage: 50,
  discountType: "PERCENTAGE",
  discountValue: 0,
  additionalDescription: "",
};
