import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { serializeQuote } from "@/lib/serializers";
import { updateQuoteSchema } from "@/lib/validations/quote";
import { calculateAreaPrice, calculateDeposit, calculateQuoteTotals } from "@/lib/pricing/engine";
import {
  loadLineCatalogs,
  resolveLineFromCatalog,
  QuoteValidationError,
  type ResolvedQuoteLine,
} from "@/lib/quote-line-resolver";
import { CENTO_CLIENT_ID } from "@/lib/constants";

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

// Editar (sección 43): "al guardar, se recalcula con los precios vigentes...
// y se reemplazan los snapshots de los elementos modificados". Una línea
// con sourceLineId (que el usuario no tocó — no la quitó ni la volvió a
// agregar) conserva su snapshot EXACTO tal como está en la base, sin
// recalcular, aunque el catálogo haya cambiado desde que se creó. Una línea
// nueva (o una que el usuario quitó y volvió a agregar, lo que le hace
// perder su sourceLineId) siempre se recalcula con precios vigentes.
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const parsed = updateQuoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const input = parsed.data;

  try {
    const existingQuote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { areas: { include: { equipment: true } } },
    });
    if (!existingQuote) {
      throw new QuoteValidationError("Cotización no encontrada");
    }

    const client = await prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) {
      throw new QuoteValidationError("El cliente seleccionado ya no existe");
    }

    // quoteType es fijo al crear, nunca cambia al editar (igual que
    // quoteNumber/status) — se usa el valor ya guardado, nunca el que venga
    // en el payload, sin importar lo que el asistente haya enviado.
    const quoteType = existingQuote.quoteType;
    if (quoteType === "CENTO") {
      if (client.id !== CENTO_CLIENT_ID) {
        throw new QuoteValidationError("Una cotización Cento debe usar el cliente fijo de Cento");
      }
      if (!input.centoVendorName?.trim() || !input.centoClientReference?.trim()) {
        throw new QuoteValidationError(
          "El vendedor de Cento y la referencia del cliente final son obligatorios",
        );
      }
    }
    if (quoteType === "CLIMATISA" && client.id === CENTO_CLIENT_ID) {
      throw new QuoteValidationError("El cliente fijo de Cento solo se usa en cotizaciones tipo Cento");
    }

    const existingLineById = new Map(
      existingQuote.areas.flatMap((area) => area.equipment.map((line) => [line.id, line])),
    );

    const linesNeedingCatalog = input.areas
      .flatMap((area) => area.equipmentLines)
      .filter((line) => !line.sourceLineId || !existingLineById.has(line.sourceLineId));

    const equipmentIds = [...new Set(linesNeedingCatalog.map((l) => l.equipmentId))];
    const complexityIds = [...new Set(linesNeedingCatalog.map((l) => l.complexityId))];
    const catalogs = await loadLineCatalogs(prisma, equipmentIds, complexityIds);

    const areaInputs = input.areas.map((area) => {
      const lines: ResolvedQuoteLine[] = area.equipmentLines.map((line) => {
        const preserved = line.sourceLineId ? existingLineById.get(line.sourceLineId) : undefined;
        if (preserved) {
          // Sin tocar: se reinserta el snapshot exacto guardado, ignorando
          // cualquier otro campo que haya venido en el payload para esta
          // línea (nunca confiar en el cliente para datos ya congelados).
          return {
            equipmentId: preserved.equipmentId,
            complexityId: preserved.complexityId,
            installationKitId: preserved.installationKitId,
            quantity: preserved.quantity,
            meters: Number(preserved.meters),
            equipmentNameSnapshot: preserved.equipmentNameSnapshot,
            equipmentPriceSnapshot: Number(preserved.equipmentPriceSnapshot),
            installationKitPriceSnapshot: Number(preserved.installationKitPriceSnapshot),
            complexityAdjustmentSnapshot: Number(preserved.complexityAdjustmentSnapshot),
            installationPriceSnapshot: Number(preserved.installationPriceSnapshot),
            lineTotal: Number(preserved.lineTotal),
          };
        }
        return resolveLineFromCatalog(line, catalogs, quoteType);
      });

      return { name: area.name, lines, areaTotal: calculateAreaPrice(lines) };
    });

    const { subtotal, discountAmount, total } = calculateQuoteTotals({
      areaTotals: areaInputs.map((a) => a.areaTotal),
      extras: input.extras.map((e) => e.price),
      discountType: input.discountType,
      discountValue: input.discountValue,
    });
    const { depositAmount, balance } = calculateDeposit(total, input.depositPercentage);

    // El número de cotización y el estado NUNCA cambian al editar — solo
    // el contenido. Se reemplazan las áreas/líneas/extras por completo (los
    // ids internos no son significativos para el usuario; lo que importa
    // es que los valores de precio queden correctos, preservados o
    // recalculados según corresponda).
    const quote = await prisma.$transaction(async (tx) => {
      await tx.quoteArea.deleteMany({ where: { quoteId: params.id } });
      await tx.quoteExtra.deleteMany({ where: { quoteId: params.id } });

      return tx.quote.update({
        where: { id: params.id },
        data: {
          clientId: client.id,
          // quoteType NO se incluye aquí a propósito: es inmutable al
          // editar, y omitirlo del data de update deja el valor guardado
          // intacto sin importar lo que haya venido en el payload.
          centoVendorName: quoteType === "CENTO" ? input.centoVendorName || null : null,
          centoClientReference: quoteType === "CENTO" ? input.centoClientReference || null : null,
          subtotal,
          discountType: input.discountType,
          discountValue: input.discountValue,
          discountAmount,
          total,
          depositPercentage: input.depositPercentage,
          depositAmount,
          balance,
          additionalDescription: input.additionalDescription || null,
          installationNotesExtra: input.installationNotesExtra || null,
          areas: {
            create: areaInputs.map((area) => ({
              name: area.name,
              areaTotal: area.areaTotal,
              equipment: { create: area.lines },
            })),
          },
          extras: { create: input.extras },
        },
        include: { client: true, areas: { include: { equipment: true } }, extras: true },
      });
    });

    return NextResponse.json({ quote: serializeQuote(quote) });
  } catch (err) {
    if (err instanceof QuoteValidationError) {
      const status = err.message === "Cotización no encontrada" ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    throw err;
  }
}
