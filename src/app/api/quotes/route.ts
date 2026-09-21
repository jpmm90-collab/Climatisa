import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { createQuoteSchema } from "@/lib/validations/quote";
import { selectInstallationKit } from "@/lib/pricing/kit-selection";
import {
  calculateAreaPrice,
  calculateDeposit,
  calculateLineTotal,
  calculateQuoteTotals,
} from "@/lib/pricing/engine";
import { generateQuoteNumber } from "@/lib/quote-number";
import { toNumber } from "@/lib/decimal";
import { serializeQuote } from "@/lib/serializers";

class QuoteValidationError extends Error {}

export async function POST(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const parsed = createQuoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const input = parsed.data;

  try {
    // Todas las lecturas van FUERA de la transacción: son varios round-trips
    // de red hacia Postgres y no necesitan mantenerse dentro de una
    // transacción interactiva abierta (eso solo agota el pool de conexiones
    // bajo carga concurrente — visto en la prueba de concurrencia). Solo la
    // generación atómica del número y la escritura final necesitan
    // transaccionalidad conjunta.
    const client = await prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) {
      throw new QuoteValidationError("El cliente seleccionado ya no existe");
    }

    const equipmentIds = [
      ...new Set(input.areas.flatMap((a) => a.equipmentLines.map((l) => l.equipmentId))),
    ];
    const complexityIds = [
      ...new Set(input.areas.flatMap((a) => a.equipmentLines.map((l) => l.complexityId))),
    ];

    const [equipmentRows, complexityRows, kitRows] = await Promise.all([
      prisma.equipment.findMany({ where: { id: { in: equipmentIds } } }),
      prisma.complexity.findMany({ where: { id: { in: complexityIds } } }),
      prisma.installationKit.findMany({ where: { active: true } }),
    ]);

    const equipmentById = new Map(equipmentRows.map((e) => [e.id, e]));
    const complexityById = new Map(complexityRows.map((c) => [c.id, c]));
    const kits = kitRows.map((k) => ({
      id: k.id,
      minMeters: toNumber(k.minMeters),
      maxMeters: k.maxMeters === null ? null : toNumber(k.maxMeters),
      price: toNumber(k.price),
      active: k.active,
    }));

    // Server-side, siempre: el pricing nunca se recalcula a partir de lo que
    // mandó el cliente, solo de sus decisiones estructurales (equipo,
    // metros, complejidad, cantidad) más los precios vigentes en este
    // momento.
    const areaInputs = input.areas.map((area) => {
      const lines = area.equipmentLines.map((line) => {
        const equipment = equipmentById.get(line.equipmentId);
        if (!equipment || !equipment.active) {
          throw new QuoteValidationError(`El equipo seleccionado ya no está disponible`);
        }
        const complexity = complexityById.get(line.complexityId);
        if (!complexity || !complexity.active) {
          throw new QuoteValidationError(`La complejidad seleccionada ya no está disponible`);
        }

        let kit;
        try {
          kit = selectInstallationKit(line.meters, kits);
        } catch {
          throw new QuoteValidationError(
            `No hay un kit de instalación configurado para ${line.meters} metros`,
          );
        }

        const totals = calculateLineTotal({
          equipmentPrice: toNumber(equipment.price),
          quantity: line.quantity,
          kitPrice: kit.price,
          complexityAdjustment: toNumber(complexity.adjustment),
        });

        return {
          equipmentId: equipment.id,
          complexityId: complexity.id,
          installationKitId: kit.id,
          quantity: line.quantity,
          meters: line.meters,
          equipmentNameSnapshot: equipment.name,
          equipmentPriceSnapshot: toNumber(equipment.price),
          installationKitPriceSnapshot: kit.price,
          complexityAdjustmentSnapshot: toNumber(complexity.adjustment),
          installationPriceSnapshot: totals.installationUnitPrice,
          lineTotal: totals.lineTotal,
        };
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

    const quote = await prisma.$transaction(
      async (tx) => {
        const quoteNumber = await generateQuoteNumber(new Date(), tx);

        return tx.quote.create({
          data: {
            quoteNumber,
            clientId: client.id,
            subtotal,
            discountType: input.discountType,
            discountValue: input.discountValue,
            discountAmount,
            total,
            depositPercentage: input.depositPercentage,
            depositAmount,
            balance,
            additionalDescription: input.additionalDescription || null,
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
      },
      // Margen defensivo: bajo alta concurrencia esta transacción puede
      // quedar en cola esperando una conexión libre del pool. El timeout
      // por defecto de Prisma (5s) es ajustado para el caso normal (una
      // persona guardando una cotización), no para ráfagas de decenas de
      // solicitudes simultáneas.
      { maxWait: 10_000, timeout: 15_000 },
    );

    return NextResponse.json({ quote: serializeQuote(quote) }, { status: 201 });
  } catch (err) {
    if (err instanceof QuoteValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
