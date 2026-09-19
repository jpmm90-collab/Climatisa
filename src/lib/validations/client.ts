import { z } from "zod";
import { TEXT_LIMITS } from "@/lib/constants";

// Guatemala: 8 dígitos habituales ("55555555" o "5555-5555"). Permitir también
// números internacionales razonables sin ser excesivamente restrictivo.
const phoneRegex = /^\+?[0-9][0-9\- ]{5,17}[0-9]$/;

// NIT es siempre string. "CF" (mayúsculas o minúsculas) es un valor válido
// explícito y nunca se valida como número. No eliminar guiones automáticamente.
const nitRegex = /^(CF|[0-9]+-?[0-9Kk]?)$/i;

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(TEXT_LIMITS.clientName, `Máximo ${TEXT_LIMITS.clientName} caracteres`),
  phone: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio")
    .regex(phoneRegex, "Ingresa un teléfono válido"),
  company: z
    .string()
    .trim()
    .min(1, "La empresa es obligatoria")
    .max(TEXT_LIMITS.company, `Máximo ${TEXT_LIMITS.company} caracteres`),
  nit: z
    .string()
    .trim()
    .min(1, "El NIT es obligatorio (usa CF si no tiene)")
    .regex(nitRegex, "Ingresa un NIT válido o CF")
    .transform((value) => (value.toUpperCase() === "CF" ? "CF" : value)),
  address: z
    .string()
    .trim()
    .max(TEXT_LIMITS.address, `Máximo ${TEXT_LIMITS.address} caracteres`)
    .optional()
    .or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;
