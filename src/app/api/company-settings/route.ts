import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth-guard";
import { serializeCompanySettings } from "@/lib/serializers";
import { companySettingsSchema } from "@/lib/validations/company-settings";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const settings = await prisma.companySettings.findFirst();
  return NextResponse.json({ settings: settings ? serializeCompanySettings(settings) : null });
}

// Solo ADMIN administra CompanySettings (sección 43: "Roles"). Fila única
// ("default", sembrada en Fase 1) — nunca se crea una segunda, siempre se
// actualiza.
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = companySettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const existing = await prisma.companySettings.findFirst();

  const settings = existing
    ? await prisma.companySettings.update({
        where: { id: existing.id },
        data: {
          companyName: parsed.data.companyName,
          logoUrl: parsed.data.logoUrl || null,
          phone: parsed.data.phone,
          email: parsed.data.email,
          address: parsed.data.address,
          commercialTerms: parsed.data.commercialTerms || null,
          defaultDepositPercentage: parsed.data.defaultDepositPercentage,
        },
      })
    : await prisma.companySettings.create({
        data: {
          companyName: parsed.data.companyName,
          logoUrl: parsed.data.logoUrl || null,
          phone: parsed.data.phone,
          email: parsed.data.email,
          address: parsed.data.address,
          commercialTerms: parsed.data.commercialTerms || null,
          defaultDepositPercentage: parsed.data.defaultDepositPercentage,
        },
      });

  return NextResponse.json({ settings: serializeCompanySettings(settings) });
}
