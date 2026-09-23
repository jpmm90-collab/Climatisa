import { z } from "zod";
import { TEXT_LIMITS } from "@/lib/constants";

// Solo se aceptan las decisiones estructurales del cotizador (qué equipo,
// cuántos metros, qué complejidad, cantidad). Los precios NUNCA se aceptan
// del cliente — el servidor siempre recalcula con el motor de precios y los
// valores vigentes en la base de datos (CLAUDE.md: "el pricing SIEMPRE se
// calcula en un motor server-side determinístico").
const quoteAreaEquipmentLineSchema = z.object({
  equipmentId: z.string().min(1),
  quantity: z.number().int().positive(),
  meters: z.number().nonnegative(),
  complexityId: z.string().min(1),
});

const quoteAreaSchema = z.object({
  name: z.string().trim().min(1, "El área necesita un nombre").max(TEXT_LIMITS.areaName),
  equipmentLines: z.array(quoteAreaEquipmentLineSchema).min(1, "El área necesita al menos un equipo"),
});

const quoteExtraSchema = z.object({
  description: z.string().trim().min(1).max(TEXT_LIMITS.extraDescription),
  price: z.number().nonnegative(),
});

// Extensión confirmada al skill (ver CLAUDE.md, "Extensiones confirmadas
// al skill"): para quién es la cotización. CLIMATISA es el flujo normal;
// CENTO es un socio comercial único y fijo (no un concepto general de
// "socios") con cliente fijo y dos campos de texto obligatorios.
const baseQuoteSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  quoteType: z.enum(["CLIMATISA", "CENTO"]).default("CLIMATISA"),
  centoVendorName: z.string().trim().max(TEXT_LIMITS.centoVendorName).optional().or(z.literal("")),
  centoClientReference: z
    .string()
    .trim()
    .max(TEXT_LIMITS.centoClientReference)
    .optional()
    .or(z.literal("")),
  areas: z.array(quoteAreaSchema).min(1, "La cotización necesita al menos un área"),
  extras: z.array(quoteExtraSchema),
  discountType: z.enum(["PERCENTAGE", "AMOUNT"]),
  discountValue: z.number().nonnegative(),
  depositPercentage: z.number().min(0).max(100),
  additionalDescription: z
    .string()
    .trim()
    .max(TEXT_LIMITS.additionalDescription)
    .optional()
    .or(z.literal("")),
  // Aclaración opcional aparte del texto base obligatorio de instalación
  // (sección 19.5) — el texto base nunca viaja en el payload, es una
  // constante del servidor (INSTALLATION_BASE_TEXT), nunca algo que el
  // cliente pueda sobreescribir.
  installationNotesExtra: z
    .string()
    .trim()
    .max(TEXT_LIMITS.installationNotesExtra)
    .optional()
    .or(z.literal("")),
});

// quoteType === "CENTO" hace obligatorios los dos campos de texto libre
// (vendedor de Cento, referencia del cliente final) — para CLIMATISA no
// aplican. Función compartida para no duplicar la regla entre crear/editar.
function requireCentoFieldsWhenCento(
  data: { quoteType: "CLIMATISA" | "CENTO"; centoVendorName?: string; centoClientReference?: string },
  ctx: z.RefinementCtx,
) {
  if (data.quoteType !== "CENTO") return;

  if (!data.centoVendorName?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["centoVendorName"],
      message: "El vendedor de Cento es obligatorio para este tipo de cotización",
    });
  }
  if (!data.centoClientReference?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["centoClientReference"],
      message: "La referencia del cliente final es obligatoria para este tipo de cotización",
    });
  }
}

export const createQuoteSchema = baseQuoteSchema.superRefine(requireCentoFieldsWhenCento);

export type CreateQuoteInput = z.infer<typeof baseQuoteSchema>;

// Edición (sección 43): "se reemplazan los snapshots de los elementos
// modificados" — sourceLineId, cuando viene presente, identifica una línea
// SIN TOCAR desde la última versión guardada; su snapshot se conserva tal
// cual, sin recalcular con precios vigentes. Su ausencia (línea nueva, o
// una línea existente que el usuario quitó y volvió a agregar) sí dispara
// el recálculo normal con precios actuales.
const updateQuoteAreaEquipmentLineSchema = quoteAreaEquipmentLineSchema.extend({
  sourceLineId: z.string().optional(),
});

const updateQuoteAreaSchema = quoteAreaSchema.extend({
  equipmentLines: z
    .array(updateQuoteAreaEquipmentLineSchema)
    .min(1, "El área necesita al menos un equipo"),
});

export const updateQuoteSchema = baseQuoteSchema
  .extend({
    areas: z.array(updateQuoteAreaSchema).min(1, "La cotización necesita al menos un área"),
  })
  .superRefine(requireCentoFieldsWhenCento);

export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
