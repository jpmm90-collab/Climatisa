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
      active: k.active,
    })),
  };
}

// Server-side, siempre: el pricing nunca se recalcula a partir de lo que
// mandó el cliente, solo de sus decisiones estructurales (equipo, metros,
// complejidad, cantidad) más los precios vigentes en este momento.
export function resolveLineFromCatalog(
  line: EquipmentLineInput,
  catalogs: LineCatalogs,
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
}
