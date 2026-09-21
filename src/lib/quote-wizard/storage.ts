import { INITIAL_WIZARD_STATE, type QuoteWizardState } from "@/lib/quote-wizard/types";

const CREATE_DRAFT_KEY = "climatisa:quote-wizard-draft";
const PENDING_CLIENT_KEY = "climatisa:quote-wizard-pending-client-id";

// Editar usa una llave de sessionStorage distinta y namespaced por id, para
// no chocar con un borrador de "crear cotización" que pudiera estar en
// progreso en otra pestaña, y para que editar dos cotizaciones distintas no
// se pisen entre sí.
function draftKey(editQuoteId?: string): string {
  return editQuoteId ? `climatisa:quote-wizard-draft:edit:${editQuoteId}` : CREATE_DRAFT_KEY;
}

// Borrador en sessionStorage: sobrevive a la navegación de ida y vuelta a
// "Crear cliente" (sección 5) sin necesitar persistencia real en base de
// datos — eso llega hasta la Fase 4.
export function loadWizardDraft(editQuoteId?: string): QuoteWizardState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(draftKey(editQuoteId));
    if (!raw) return null;
    return { ...INITIAL_WIZARD_STATE, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function hasWizardDraft(editQuoteId?: string): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(draftKey(editQuoteId)) !== null;
}

export function saveWizardDraft(state: QuoteWizardState, editQuoteId?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(draftKey(editQuoteId), JSON.stringify(state));
  } catch {
    // almacenamiento no disponible (modo privado, etc.) — no es crítico
  }
}

export function clearWizardDraft(editQuoteId?: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(draftKey(editQuoteId));
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
