import { z } from "zod";

export const equipmentSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  brand: z.string().trim().min(1, "La marca es obligatoria").max(60),
  model: z.string().trim().min(1, "El modelo es obligatorio").max(60),
  btu: z.number().int("Los BTU deben ser un número entero").positive("Los BTU deben ser mayores a 0"),
  type: z.string().trim().min(1, "El tipo es obligatorio").max(60),
  price: z.number().nonnegative("El precio no puede ser negativo"),
  active: z.boolean(),
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;
