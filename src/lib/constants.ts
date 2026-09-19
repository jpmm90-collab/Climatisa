// Vendedor/responsable fijo en toda cotización y PDF. No se pide al usuario,
// no depende del usuario autenticado, no es editable desde el flujo normal
// (skill, sección 43 — "Vendedor / responsable fijo de la cotización").
export const VENDEDOR_RESPONSABLE = "Romeo Morales";

export const TIMEZONE = "America/Guatemala";

export const CURRENCY = "GTQ";

export const TEXT_LIMITS = {
  clientName: 120,
  company: 120,
  address: 300,
  areaName: 60,
  extraDescription: 200,
  additionalDescription: 500,
  commercialTerms: 2000,
} as const;
