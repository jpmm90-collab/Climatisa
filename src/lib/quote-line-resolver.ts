import type { Complexity, Equipment, PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { selectInstallationKit, type InstallationKitRange } from "@/lib/pricing/kit-selection";
import { calculateLineTotal } from "@/lib/pricing/engine";
import { toNumber } from "@/lib/decimal";

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

export class QuoteValidationError extends Error {}

export interface EquipmentLineInput {
  equipmentId: string;
  quantity: number;
  meters: number;
  complexityId: string;
}

export interface ResolvedQuoteLine {
  equipmentId: string;
  complexityId: string;
  installationKitId: string;
  quantity: number;
  meters: number;
  equipmentNameSnapshot: string;
  equipmentPriceSnapshot: number;
  installationKitPriceSnapshot: number;
  complexityAdjustmentSnapshot: number;
  installationPriceSnapshot: number;
  lineTotal: number;
}

export interface LineCatalogs {
  equipmentById: Map<string, Equipment>;
  complexityById: Map<string, Complexity>;
  kits: InstallationKitRange[];
}

// Carga, en un solo round-trip por tabla, los equipos/complejidades
// referenciados por las líneas enviadas más todos los kits activos (los
// kits se resuelven por metros, no por id, así que hacen falta todos).
export async function loadLineCatalogs(
  client: PrismaClientOrTx,
  equipmentIds: string[],
  complexityIds: string[],
): Promise<LineCatalogs> {
  const [equipmentRows, complexityRows, kitRows] = await Promise.all([
    client.equipment.findMany({ where: { id: { in: equipmentIds } } }),
    client.complexity.findMany({ where: { id: { in: complexityIds } } }),
    client.installationKit.findMany({ where: { active: true } }),
  ]);

  return {
    equipmentById: new Map(equipmentRows.map((e) => [e.id, e])),
    complexityById: new Map(complexityRows.map((c) => [c.id, c])),
    kits: kitRows.map((k) => ({
      id: k.id,
      minMeters: toNumber(k.minMeters),
      maxMeters: k.maxMeters === null ? null : toNumber(k.maxMeters),
      price: toNumber(k.price),
      partnerPrice: toNumber(k.partnerPrice),
      active: k.active,
    })),
  };
}

// Server-side, siempre: el pricing nunca se recalcula a partir de lo que
// mandó el cliente, solo de sus decisiones estructurales (equipo, metros,
// complejidad, cantidad) más los precios vigentes en este momento.
//
// quoteType (extensión confirmada, ver CLAUDE.md): decide qué tarifa está
// vigente en este momento, no cambia la aritmética en sí — calculateLineTotal
// no se toca. Para CENTO: el equipo no se cobra (Cento ya es dueño del
// equipo, Q 0.00 explícito, nunca omitido) y el kit/complejidad usan la
// tarifa de socio en vez de la normal. Default CLIMATISA para no romper
// ningún llamado existente (creación de cotizaciones normales, pruebas).
export function resolveLineFromCatalog(
  line: EquipmentLineInput,
  catalogs: LineCatalogs,
  quoteType: "CLIMATISA" | "CENTO" = "CLIMATISA",
): ResolvedQuoteLine {
  const equipment = catalogs.equipmentById.get(line.equipmentId);
  if (!equipment || !equipment.active) {
    throw new QuoteValidationError("El equipo seleccionado ya no está disponible");
  }
  const complexity = catalogs.complexityById.get(line.complexityId);
  if (!complexity || !complexity.active) {
    throw new QuoteValidationError("La complejidad seleccionada ya no está disponible");
  }

  let kit;
  try {
    kit = selectInstallationKit(line.meters, catalogs.kits);
  } catch {
    throw new QuoteValidationError(
      `No hay un kit de instalación configurado para ${line.meters} metros`,
    );
  }

  const isCento = quoteType === "CENTO";
  const equipmentPrice = isCento ? 0 : toNumber(equipment.price);
  const kitPrice = isCento ? (kit.partnerPrice ?? 0) : kit.price;
  const complexityAdjustment = isCento
    ? toNumber(complexity.partnerAdjustment)
    : toNumber(complexity.adjustment);

  const totals = calculateLineTotal({
    equipmentPrice,
    quantity: line.quantity,
    kitPrice,
    complexityAdjustment,
  });

  return {
    equipmentId: equipment.id,
    complexityId: complexity.id,
    installationKitId: kit.id,
    quantity: line.quantity,
    meters: line.meters,
    equipmentNameSnapshot: equipment.name,
    equipmentPriceSnapshot: equipmentPrice,
    installationKitPriceSnapshot: kitPrice,
    complexityAdjustmentSnapshot: complexityAdjustment,
    installationPriceSnapshot: totals.installationUnitPrice,
    lineTotal: totals.lineTotal,
  };
}
