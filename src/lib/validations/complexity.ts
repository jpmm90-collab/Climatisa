import { z } from "zod";

export const complexitySchema = z.object({
  level: z.number().int().positive("El nivel debe ser un entero positivo"),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(300),
  adjustment: z.number().nonnegative("El ajuste no puede ser negativo"),
  active: z.boolean(),
});

export type ComplexityInput = z.infer<typeof complexitySchema>;
