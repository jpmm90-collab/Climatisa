import { z } from "zod";

// Solo unos pocos estados, sin workflow complejo (skill, sección 28).
export const updateQuoteStatusSchema = z.object({
  status: z.enum(["SENT", "ACCEPTED", "REJECTED", "DRAFT"]),
});

export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;
