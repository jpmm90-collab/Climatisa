import type {
  Equipment,
  InstallationKit,
  Complexity,
  CompanySettings,
  Client,
  Quote,
  QuoteArea,
  QuoteAreaEquipment,
  QuoteExtra,
} from "@prisma/client";
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

export function serializeQuoteAreaEquipment(line: QuoteAreaEquipment) {
  return {
    ...line,
    meters: toNumber(line.meters),
    equipmentPriceSnapshot: toNumber(line.equipmentPriceSnapshot),
    installationKitPriceSnapshot: toNumber(line.installationKitPriceSnapshot),
    complexityAdjustmentSnapshot: toNumber(line.complexityAdjustmentSnapshot),
    installationPriceSnapshot: toNumber(line.installationPriceSnapshot),
    lineTotal: toNumber(line.lineTotal),
  };
}

export function serializeQuoteArea(area: QuoteArea & { equipment: QuoteAreaEquipment[] }) {
  return {
    ...area,
    areaTotal: toNumber(area.areaTotal),
    equipment: area.equipment.map(serializeQuoteAreaEquipment),
  };
}

export function serializeQuoteExtra(extra: QuoteExtra) {
  return { ...extra, price: toNumber(extra.price) };
}

type QuoteWithRelations = Quote & {
  client: Client;
  areas: (QuoteArea & { equipment: QuoteAreaEquipment[] })[];
  extras: QuoteExtra[];
};

export function serializeQuote(quote: QuoteWithRelations) {
  return {
    ...quote,
    subtotal: toNumber(quote.subtotal),
    discountValue: toNumber(quote.discountValue),
    discountAmount: toNumber(quote.discountAmount),
    total: toNumber(quote.total),
    depositPercentage: toNumber(quote.depositPercentage),
    depositAmount: toNumber(quote.depositAmount),
    balance: toNumber(quote.balance),
    areas: quote.areas.map(serializeQuoteArea),
    extras: quote.extras.map(serializeQuoteExtra),
  };
}
