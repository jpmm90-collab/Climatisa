import { describe, expect, it } from "vitest";
import {
  calculateAreaPrice,
  calculateDeposit,
  calculateInstallationPrice,
  calculateLineTotal,
  calculateQuoteTotals,
} from "@/lib/pricing/engine";

describe("calculateInstallationPrice", () => {
  it("suma el precio del kit y el ajuste de complejidad", () => {
    expect(calculateInstallationPrice(500, 150)).toBe(650);
  });

  it("acepta ajuste cero", () => {
    expect(calculateInstallationPrice(500, 0)).toBe(500);
  });

  it("lanza error si el kit es negativo", () => {
    expect(() => calculateInstallationPrice(-1, 0)).toThrow();
  });

  it("lanza error si el ajuste es negativo", () => {
    expect(() => calculateInstallationPrice(0, -1)).toThrow();
  });
});

describe("calculateLineTotal", () => {
  it("calcula equipo + instalación para cantidad 1", () => {
    const result = calculateLineTotal({
      equipmentPrice: 4000,
      quantity: 1,
      kitPrice: 500,
      complexityAdjustment: 200,
    });

    expect(result.equipmentTotal).toBe(4000);
    expect(result.installationUnitPrice).toBe(700);
    expect(result.installationTotal).toBe(700);
    expect(result.lineTotal).toBe(4700);
  });

  it("multiplica equipo e instalación por la cantidad", () => {
    const result = calculateLineTotal({
      equipmentPrice: 4000,
      quantity: 3,
      kitPrice: 500,
      complexityAdjustment: 200,
    });

    expect(result.equipmentTotal).toBe(12000);
    expect(result.installationTotal).toBe(2100);
    expect(result.lineTotal).toBe(14100);
  });

  it("redondea a dos decimales", () => {
    const result = calculateLineTotal({
      equipmentPrice: 33.335,
      quantity: 1,
      kitPrice: 0,
      complexityAdjustment: 0,
    });

    expect(result.lineTotal).toBe(33.34);
  });

  it("lanza error con cantidad menor a 1", () => {
    expect(() =>
      calculateLineTotal({ equipmentPrice: 100, quantity: 0, kitPrice: 0, complexityAdjustment: 0 }),
    ).toThrow();
  });

  it("lanza error con cantidad no entera", () => {
    expect(() =>
      calculateLineTotal({ equipmentPrice: 100, quantity: 1.5, kitPrice: 0, complexityAdjustment: 0 }),
    ).toThrow();
  });

  it("lanza error con precio de equipo negativo", () => {
    expect(() =>
      calculateLineTotal({ equipmentPrice: -1, quantity: 1, kitPrice: 0, complexityAdjustment: 0 }),
    ).toThrow();
  });
});

describe("calculateAreaPrice", () => {
  it("suma los totales de línea del área", () => {
    const total = calculateAreaPrice([{ lineTotal: 1000 }, { lineTotal: 2500.5 }]);
    expect(total).toBe(3500.5);
  });

  it("un área sin líneas da cero", () => {
    expect(calculateAreaPrice([])).toBe(0);
  });
});

describe("calculateQuoteTotals", () => {
  it("calcula subtotal sin descuento", () => {
    const result = calculateQuoteTotals({
      areaTotals: [1000, 2000],
      extras: [500],
      discountType: "AMOUNT",
      discountValue: 0,
    });

    expect(result.subtotal).toBe(3500);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(3500);
  });

  it("aplica descuento porcentual", () => {
    const result = calculateQuoteTotals({
      areaTotals: [10000],
      extras: [],
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    expect(result.subtotal).toBe(10000);
    expect(result.discountAmount).toBe(1000);
    expect(result.total).toBe(9000);
  });

  it("aplica descuento por monto fijo", () => {
    const result = calculateQuoteTotals({
      areaTotals: [10000],
      extras: [],
      discountType: "AMOUNT",
      discountValue: 1500,
    });

    expect(result.discountAmount).toBe(1500);
    expect(result.total).toBe(8500);
  });

  it("nunca deja el total en negativo si el descuento excede el subtotal", () => {
    const result = calculateQuoteTotals({
      areaTotals: [1000],
      extras: [],
      discountType: "AMOUNT",
      discountValue: 5000,
    });

    expect(result.discountAmount).toBe(1000);
    expect(result.total).toBe(0);
  });

  it("un descuento porcentual mayor a 100% se limita al subtotal", () => {
    const result = calculateQuoteTotals({
      areaTotals: [1000],
      extras: [],
      discountType: "PERCENTAGE",
      discountValue: 150,
    });

    expect(result.total).toBe(0);
  });

  it("lanza error con descuento negativo", () => {
    expect(() =>
      calculateQuoteTotals({ areaTotals: [1000], extras: [], discountType: "AMOUNT", discountValue: -1 }),
    ).toThrow();
  });
});

describe("calculateDeposit", () => {
  it("calcula anticipo y saldo con 50%", () => {
    const result = calculateDeposit(16200, 50);
    expect(result.depositAmount).toBe(8100);
    expect(result.balance).toBe(8100);
  });

  it("0% de anticipo deja todo en el saldo", () => {
    const result = calculateDeposit(1000, 0);
    expect(result.depositAmount).toBe(0);
    expect(result.balance).toBe(1000);
  });

  it("100% de anticipo deja el saldo en cero", () => {
    const result = calculateDeposit(1000, 100);
    expect(result.depositAmount).toBe(1000);
    expect(result.balance).toBe(0);
  });

  it("lanza error con porcentaje fuera de 0-100", () => {
    expect(() => calculateDeposit(1000, 150)).toThrow();
    expect(() => calculateDeposit(1000, -10)).toThrow();
  });

  it("lanza error con total negativo", () => {
    expect(() => calculateDeposit(-1, 50)).toThrow();
  });
});
