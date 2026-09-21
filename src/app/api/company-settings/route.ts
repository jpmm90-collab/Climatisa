import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";

// Solo lectura por ahora: la administración de CompanySettings (Fase 6,
// "administración de parámetros") todavía no está construida. El cotizador
// necesita el porcentaje de anticipo predeterminado para la Fase 3.
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const settings = await prisma.companySettings.findFirst();
  return NextResponse.json({ settings });
}
