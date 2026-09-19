import { z } from "zod";

export const installationKitSchema = z
  .object({
    minMeters: z.number().nonnegative("Los metros mínimos no pueden ser negativos"),
    // Vacío/null = sin límite superior (último rango, sección 43).
    maxMeters: z.number().positive().nullable(),
    price: z.number().nonnegative("El precio no puede ser negativo"),
    active: z.boolean(),
  })
  .refine((data) => data.maxMeters === null || data.maxMeters > data.minMeters, {
    message: "El límite superior debe ser mayor al límite inferior",
    path: ["maxMeters"],
  });

export type InstallationKitInput = z.infer<typeof installationKitSchema>;
