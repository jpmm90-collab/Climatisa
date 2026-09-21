import type { DiscountType } from "@/lib/pricing/engine";

export interface WizardClient {
  id: string;
  name: string;
  phone: string;
  nit: string;
}

export interface WizardEquipmentLine {
  lineId: string;
  // Presente solo cuando la línea viene sin tocar de una cotización que se
  // está editando (id de QuoteAreaEquipment). Su presencia le dice al
  // servidor "conserva el snapshot exacto, no recalcules" (sección 43).
  // Si el usuario quita esta línea y agrega una nueva, la nueva línea nace
  // sin sourceLineId — se recalcula con precios vigentes, como cualquier
  // línea nueva.
  sourceLineId?: string;
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
  // Texto adicional de instalación (sección 19.5), SEPARADO del texto base
  // obligatorio (INSTALLATION_BASE_TEXT) — nunca lo reemplaza ni lo toca,
  // el usuario solo puede agregar una aclaración aparte.
  installationNotesExtra: string;
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
  installationNotesExtra: "",
};
