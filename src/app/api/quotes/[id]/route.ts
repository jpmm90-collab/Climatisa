import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { serializeQuote } from "@/lib/serializers";

// Ver una cotización SIEMPRE muestra sus snapshots históricos, nunca
// recalcula con precios vigentes (sección 43: "ver = histórico").
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession();
  if (error) return error;

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      areas: { include: { equipment: true } },
      extras: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ quote: serializeQuote(quote) });
}
