import { describe, expect, it } from "vitest";
import { resolveLineFromCatalog, QuoteValidationError, type LineCatalogs } from "@/lib/quote-line-resolver";

function makeCatalogs(overrides: Partial<LineCatalogs> = {}): LineCatalogs {
  return {
    equipmentById: new Map([
      ["eq1", { id: "eq1", name: "Split 12k", price: 4000, active: true } as never],
    ]),
    complexityById: new Map([
      ["cx1", { id: "cx1", name: "Media", adjustment: 300, active: true } as never],
    ]),
    kits: [{ id: "kit1", minMeters: 0, maxMeters: 10, price: 200, active: true }],
    ...overrides,
  };
}

describe("resolveLineFromCatalog", () => {
  it("resuelve una línea válida con los precios vigentes del catálogo", () => {
    const result = resolveLineFromCatalog(
      { equipmentId: "eq1", quantity: 1, meters: 5, complexityId: "cx1" },
      makeCatalogs(),
    );
    expect(result.equipmentPriceSnapshot).toBe(4000);
    expect(result.installationKitPriceSnapshot).toBe(200);
    expect(result.complexityAdjustmentSnapshot).toBe(300);
    expect(result.installationPriceSnapshot).toBe(500);
    expect(result.lineTotal).toBe(4500);
  });

  it("rechaza un equipo que no existe", () => {
    expect(() =>
      resolveLineFromCatalog(
        { equipmentId: "no-existe", quantity: 1, meters: 5, complexityId: "cx1" },
        makeCatalogs(),
      ),
    ).toThrow(QuoteValidationError);
  });

  it("rechaza un equipo inactivo", () => {
    const catalogs = makeCatalogs({
      equipmentById: new Map([
        ["eq1", { id: "eq1", name: "Split 12k", price: 4000, active: false } as never],
      ]),
    });
    expect(() =>
      resolveLineFromCatalog({ equipmentId: "eq1", quantity: 1, meters: 5, complexityId: "cx1" }, catalogs),
    ).toThrow(QuoteValidationError);
  });

  it("rechaza una complejidad inactiva", () => {
    const catalogs = makeCatalogs({
      complexityById: new Map([
        ["cx1", { id: "cx1", name: "Media", adjustment: 300, active: false } as never],
      ]),
    });
    expect(() =>
      resolveLineFromCatalog({ equipmentId: "eq1", quantity: 1, meters: 5, complexityId: "cx1" }, catalogs),
    ).toThrow(QuoteValidationError);
  });

  it("rechaza metros sin kit configurado", () => {
    expect(() =>
      resolveLineFromCatalog(
        { equipmentId: "eq1", quantity: 1, meters: 999, complexityId: "cx1" },
        makeCatalogs(),
      ),
    ).toThrow(QuoteValidationError);
  });

  it("multiplica correctamente por cantidad", () => {
    const result = resolveLineFromCatalog(
      { equipmentId: "eq1", quantity: 3, meters: 5, complexityId: "cx1" },
      makeCatalogs(),
    );
    expect(result.lineTotal).toBe(4500 * 3);
  });
});
