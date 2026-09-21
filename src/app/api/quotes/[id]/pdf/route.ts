import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { toNumber } from "@/lib/decimal";
import { renderQuotePdf } from "@/lib/pdf/render-quote-pdf";
import type { QuotePdfData } from "@/lib/pdf/types";

// Ver/generar el PDF siempre lee los snapshots guardados de precios, nunca
// recalcula (sección 43: "ver = histórico"). CompanySettings es la única
// excepción deliberada: nombre, logo, contacto y condiciones comerciales se
// leen SIEMPRE en vivo, sin snapshot por cotización. Decisión confirmada
// explícitamente con el usuario — la sección 43 solo nombra snapshot para
// precios de equipo/kit/complejidad; si la empresa corrige un teléfono o
// dirección, todas las cotizaciones (viejas y nuevas) deben mostrar el dato
// correcto en vez de perpetuar un error.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession();
  if (error) return error;

  const [quote, companySettings] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: params.id },
      include: { client: true, areas: { include: { equipment: true } }, extras: true },
    }),
    prisma.companySettings.findFirst(),
  ]);

  if (!quote) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }
  if (!companySettings) {
    return NextResponse.json({ error: "No hay datos de empresa configurados" }, { status: 500 });
  }

  const data: QuotePdfData = {
    quoteNumber: quote.quoteNumber,
    date: quote.date,
    client: {
      name: quote.client.name,
      phone: quote.client.phone,
      address: quote.client.address,
      company: quote.client.company,
      nit: quote.client.nit,
    },
    areas: quote.areas.map((area) => ({
      name: area.name,
      areaTotal: toNumber(area.areaTotal),
      equipment: area.equipment.map((line) => ({
        equipmentNameSnapshot: line.equipmentNameSnapshot,
        quantity: line.quantity,
        meters: toNumber(line.meters),
        equipmentPriceSnapshot: toNumber(line.equipmentPriceSnapshot),
        installationPriceSnapshot: toNumber(line.installationPriceSnapshot),
        lineTotal: toNumber(line.lineTotal),
      })),
    })),
    extras: quote.extras.map((extra) => ({
      description: extra.description,
      price: toNumber(extra.price),
    })),
    subtotal: toNumber(quote.subtotal),
    discountAmount: toNumber(quote.discountAmount),
    total: toNumber(quote.total),
    depositPercentage: toNumber(quote.depositPercentage),
    depositAmount: toNumber(quote.depositAmount),
    balance: toNumber(quote.balance),
    additionalDescription: quote.additionalDescription,
    installationNotesExtra: quote.installationNotesExtra,
    companySettings: {
      companyName: companySettings.companyName,
      logoUrl: companySettings.logoUrl,
      phone: companySettings.phone,
      email: companySettings.email,
      address: companySettings.address,
      commercialTerms: companySettings.commercialTerms,
    },
  };

  const pdfBuffer = await renderQuotePdf(data);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.quoteNumber}.pdf"`,
    },
  });
}
