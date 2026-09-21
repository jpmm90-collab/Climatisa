import { z } from "zod";
import { TEXT_LIMITS } from "@/lib/constants";

export const companySettingsSchema = z.object({
  companyName: z.string().trim().min(1, "El nombre de la empresa es obligatorio").max(120),
  logoUrl: z
    .string()
    .trim()
    .url("Ingresa una URL válida")
    .max(500)
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().min(1, "El teléfono es obligatorio").max(30),
  email: z.string().trim().min(1, "El correo es obligatorio").email("Ingresa un correo válido").max(120),
  address: z.string().trim().min(1, "La dirección es obligatoria").max(TEXT_LIMITS.address),
  commercialTerms: z
    .string()
    .trim()
    .max(TEXT_LIMITS.commercialTerms)
    .optional()
    .or(z.literal("")),
  defaultDepositPercentage: z.number().min(0).max(100),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
