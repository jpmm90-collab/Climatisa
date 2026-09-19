// Motor de precios determinístico (skill, secciones 31 y 43). Toda la
// aritmética de una cotización pasa por aquí; nunca se duplica en el
// frontend ni se hardcodean precios.

export type DiscountType = "PERCENTAGE" | "AMOUNT";

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface LineInput {
  equipmentPrice: number;
  quantity: number;
  kitPrice: number;
  complexityAdjustment: number;
}

export interface LineTotals {
  equipmentTotal: number;
  installationUnitPrice: number;
  installationTotal: number;
  lineTotal: number;
}

// installation_unit_price = kit_price + complexity_adjustment
export function calculateInstallationPrice(kitPrice: number, complexityAdjustment: number): number {
  if (kitPrice < 0 || complexityAdjustment < 0) {
    throw new Error("Los precios de instalación no pueden ser negativos");
  }
  return roundCurrency(kitPrice + complexityAdjustment);
}

// Precio de una línea de equipo instalado (un equipo dentro de un área, con
// su propio kit y complejidad — sección 43).
export function calculateLineTotal(input: LineInput): LineTotals {
  const { equipmentPrice, quantity, kitPrice, complexityAdjustment } = input;

  if (equipmentPrice < 0) {
    throw new Error("El precio del equipo no puede ser negativo");
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("La cantidad debe ser un entero mayor o igual a 1");
  }

  const equipmentTotal = roundCurrency(equipmentPrice * quantity);
  const installationUnitPrice = calculateInstallationPrice(kitPrice, complexityAdjustment);
  const installationTotal = roundCurrency(installationUnitPrice * quantity);
  const lineTotal = roundCurrency(equipmentTotal + installationTotal);

  return { equipmentTotal, installationUnitPrice, installationTotal, lineTotal };
}

// area_total = suma(line_total)
export function calculateAreaPrice(lines: Pick<LineTotals, "lineTotal">[]): number {
  return roundCurrency(lines.reduce((sum, line) => sum + line.lineTotal, 0));
}

export interface QuoteTotalsInput {
  areaTotals: number[];
  extras: number[];
  discountType: DiscountType;
  discountValue: number;
}

export interface QuoteTotals {
  subtotal: number;
  discountAmount: number;
  total: number;
}

// quote_subtotal = suma(area_total) + suma(extras)
// discount_amount se calcula según tipo, sin poder exceder el subtotal
// (sección 17: nunca permitir que un descuento genere un total negativo).
export function calculateQuoteTotals(input: QuoteTotalsInput): QuoteTotals {
  const { areaTotals, extras, discountType, discountValue } = input;

  if (discountValue < 0) {
    throw new Error("El descuento no puede ser negativo");
  }

  const subtotal = roundCurrency(
    areaTotals.reduce((sum, value) => sum + value, 0) + extras.reduce((sum, value) => sum + value, 0),
  );

  const rawDiscount =
    discountType === "PERCENTAGE" ? (subtotal * discountValue) / 100 : discountValue;

  const discountAmount = roundCurrency(Math.min(Math.max(rawDiscount, 0), subtotal));
  const total = roundCurrency(subtotal - discountAmount);

  return { subtotal, discountAmount, total };
}

export interface DepositResult {
  depositAmount: number;
  balance: number;
}

// deposit_amount = total * porcentaje / 100; balance = total - deposit_amount
export function calculateDeposit(total: number, depositPercentage: number): DepositResult {
  if (total < 0) {
    throw new Error("El total no puede ser negativo");
  }
  if (depositPercentage < 0 || depositPercentage > 100) {
    throw new Error("El porcentaje de anticipo debe estar entre 0 y 100");
  }

  const depositAmount = roundCurrency((total * depositPercentage) / 100);
  const balance = roundCurrency(total - depositAmount);

  return { depositAmount, balance };
}
