import type { Equipment, InstallationKit, Complexity, CompanySettings } from "@prisma/client";
import { toNullableNumber, toNumber } from "@/lib/decimal";

// Convierte los registros de Prisma (con campos Decimal) a la forma que
// consume el frontend (números planos). Toda respuesta de API que incluya
// alguno de estos modelos debe pasar por aquí antes de `NextResponse.json`,
// para que ningún consumidor — presente o futuro (Fase 4: persistencia de
// cotizaciones, PDF) — tenga que recordar convertir por su cuenta.

export function serializeEquipment(equipment: Equipment) {
  return { ...equipment, price: toNumber(equipment.price) };
}

export function serializeInstallationKit(kit: InstallationKit) {
  return {
    ...kit,
    minMeters: toNumber(kit.minMeters),
    maxMeters: toNullableNumber(kit.maxMeters),
    price: toNumber(kit.price),
  };
}

export function serializeComplexity(complexity: Complexity) {
  return { ...complexity, adjustment: toNumber(complexity.adjustment) };
}

export function serializeCompanySettings(settings: CompanySettings) {
  return { ...settings, defaultDepositPercentage: toNumber(settings.defaultDepositPercentage) };
}
