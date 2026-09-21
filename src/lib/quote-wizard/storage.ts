import { INITIAL_WIZARD_STATE, type QuoteWizardState } from "@/lib/quote-wizard/types";

const DRAFT_KEY = "climatisa:quote-wizard-draft";
const PENDING_CLIENT_KEY = "climatisa:quote-wizard-pending-client-id";

// Borrador en sessionStorage: sobrevive a la navegación de ida y vuelta a
// "Crear cliente" (sección 5) sin necesitar persistencia real en base de
// datos — eso llega hasta la Fase 4.
export function loadWizardDraft(): QuoteWizardState {
  if (typeof window === "undefined") return INITIAL_WIZARD_STATE;

  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return INITIAL_WIZARD_STATE;
    return { ...INITIAL_WIZARD_STATE, ...JSON.parse(raw) };
  } catch {
    return INITIAL_WIZARD_STATE;
  }
}

export function hasWizardDraft(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DRAFT_KEY) !== null;
}

export function saveWizardDraft(state: QuoteWizardState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {
    // almacenamiento no disponible (modo privado, etc.) — no es crítico
  }
}

export function clearWizardDraft(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DRAFT_KEY);
}

// El formulario de "Crear cliente" deja aquí el id del cliente recién creado
// antes de regresar, para que el asistente lo seleccione automáticamente
// (sección 5: "regresar automáticamente... con el cliente ya seleccionado").
export function setPendingSelectedClientId(clientId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_CLIENT_KEY, clientId);
}

export function consumePendingSelectedClientId(): string | null {
  if (typeof window === "undefined") return null;
  const id = window.sessionStorage.getItem(PENDING_CLIENT_KEY);
  if (id) window.sessionStorage.removeItem(PENDING_CLIENT_KEY);
  return id;
}
