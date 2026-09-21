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

export const createQuoteSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
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

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
