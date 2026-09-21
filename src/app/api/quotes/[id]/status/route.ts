import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { updateQuoteStatusSchema } from "@/lib/validations/quote-status";

// Cambiar el estado (Enviada/Aceptada/Rechazada) es una acción manual del
// cotizador, no algo que dispare la generación del PDF (skill, sección 43:
// "Generar el PDF NO cambia automáticamente el estado").
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const parsed = updateQuoteStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const existing = await prisma.quote.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  const quote = await prisma.quote.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ quote: { id: quote.id, status: quote.status } });
}
