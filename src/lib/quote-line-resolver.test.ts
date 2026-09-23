import { describe, expect, it } from "vitest";
import { resolveLineFromCatalog, QuoteValidationError, type LineCatalogs } from "@/lib/quote-line-resolver";

function makeCatalogs(overrides: Partial<LineCatalogs> = {}): LineCatalogs {
  return {
    equipmentById: new Map([
      ["eq1", { id: "eq1", name: "Split 12k", price: 4000, active: true } as never],
    ]),
    // partnerAdjustment/partnerPrice (extensión Cento, ver CLAUDE.md) se
    // dejan con valores distintos a los normales a propósito, para que las
    // pruebas de Cento noten si por error se usara la tarifa equivocada.
    complexityById: new Map([
      ["cx1", { id: "cx1", name: "Media", adjustment: 300, partnerAdjustment: 100, active: true } as never],
    ]),
    kits: [
      { id: "kit1", minMeters: 0, maxMeters: 10, price: 200, partnerPrice: 150, active: true },
    ],
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

// Extensión confirmada al skill (ver CLAUDE.md, "Extensiones confirmadas
// al skill"): quoteType CENTO — el equipo no se cobra (Q 0.00 explícito),
// el kit/complejidad usan tarifa de socio en vez de la normal.
// calculateLineTotal en sí NO se toca; todo pasa por aquí, en el resolver.
describe("resolveLineFromCatalog — cotización tipo Cento", () => {
  it("pone el equipo en Q 0.00 aunque el catálogo tenga un precio normal distinto", () => {
    const result = resolveLineFromCatalog(
      { equipmentId: "eq1", quantity: 1, meters: 5, complexityId: "cx1" },
      makeCatalogs(),
      "CENTO",
    );
    expect(result.equipmentPriceSnapshot).toBe(0);
  });

  it("usa la tarifa de socio del kit y de la complejidad, no la normal", () => {
    const result = resolveLineFromCatalog(
      { equipmentId: "eq1", quantity: 1, meters: 5, complexityId: "cx1" },
      makeCatalogs(),
      "CENTO",
    );
    // partnerPrice=150, partnerAdjustment=100 (vs. normales 200 y 300)
    expect(result.installationKitPriceSnapshot).toBe(150);
    expect(result.complexityAdjustmentSnapshot).toBe(100);
    expect(result.installationPriceSnapshot).toBe(250);
    // lineTotal = equipo (0) + instalación (250) * cantidad (1)
    expect(result.lineTotal).toBe(250);
  });

  it("multiplica la instalación a tarifa de socio por cantidad, con el equipo siempre en 0", () => {
    const result = resolveLineFromCatalog(
      { equipmentId: "eq1", quantity: 3, meters: 5, complexityId: "cx1" },
      makeCatalogs(),
      "CENTO",
    );
    expect(result.equipmentPriceSnapshot).toBe(0);
    expect(result.lineTotal).toBe(250 * 3);
  });

  it("sin quoteType (default) se comporta exactamente como CLIMATISA — no rompe el camino existente", () => {
    const withDefault = resolveLineFromCatalog(
      { equipmentId: "eq1", quantity: 1, meters: 5, complexityId: "cx1" },
      makeCatalogs(),
    );
    const withExplicitClimatisa = resolveLineFromCatalog(
      { equipmentId: "eq1", quantity: 1, meters: 5, complexityId: "cx1" },
      makeCatalogs(),
      "CLIMATISA",
    );
    expect(withDefault).toEqual(withExplicitClimatisa);
    expect(withDefault.equipmentPriceSnapshot).toBe(4000);
    expect(withDefault.installationKitPriceSnapshot).toBe(200);
    expect(withDefault.complexityAdjustmentSnapshot).toBe(300);
  });
});
