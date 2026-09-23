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
  centoVendorName: 120,
  centoClientReference: 200,
} as const;

// Extensión confirmada al skill (ver CLAUDE.md, "Extensiones confirmadas
// al skill"): Cento es un socio comercial único y fijo, no un concepto
// general de "socios" — su cliente es un registro sembrado una sola vez,
// nunca buscado ni creado desde el asistente. Id fijo y literal (mismo
// patrón que CompanySettings.id = "default"), no un cuid generado.
export const CENTO_CLIENT_ID = "cento";
export const CENTO_CLIENT_NAME = "Cento";

// Nota obligatoria (no ocultar ni omitir) para que una línea de equipo en
// Q 0.00 de una cotización Cento no parezca un error — el equipo lo pone
// el cliente, Climatisa no lo cotiza.
export const CENTO_EQUIPMENT_SUPPLIED_NOTE = "Equipo suministrado por el cliente";
