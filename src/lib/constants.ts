// Vendedor/responsable fijo en toda cotización y PDF. No se pide al usuario,
// no depende del usuario autenticado, no es editable desde el flujo normal
// (skill, sección 43 — "Vendedor / responsable fijo de la cotización").
export const VENDEDOR_RESPONSABLE = "Romeo Morales";

// Texto base obligatorio de instalación (skill, sección 19.5). Siempre
// presente, nunca editable ni borrable desde la UI — el usuario solo puede
// agregar un texto adicional aparte (Quote.installationNotesExtra), nunca
// modificar o reemplazar este texto base.
export const INSTALLATION_BASE_TEXT =
  "La instalación cubre todo el equipo, materiales y mano de obra.";

export const TIMEZONE = "America/Guatemala";

export const CURRENCY = "GTQ";

export const TEXT_LIMITS = {
  clientName: 120,
  company: 120,
  address: 300,
  areaName: 60,
  extraDescription: 200,
  additionalDescription: 500,
  installationNotesExtra: 500,
  commercialTerms: 2000,
} as const;
