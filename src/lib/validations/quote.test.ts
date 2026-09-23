import { describe, expect, it } from "vitest";
import { createQuoteSchema } from "@/lib/validations/quote";

// Extensión confirmada al skill (ver CLAUDE.md, "Extensiones confirmadas
// al skill"): quoteType CENTO hace obligatorios centoVendorName y
// centoClientReference; CLIMATISA no los necesita en absoluto.
function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    clientId: "client1",
    quoteType: "CLIMATISA",
    areas: [
      {
        name: "Sala",
        equipmentLines: [{ equipmentId: "eq1", quantity: 1, meters: 5, complexityId: "cx1" }],
      },
    ],
    extras: [],
    discountType: "PERCENTAGE",
    discountValue: 0,
    depositPercentage: 50,
    ...overrides,
  };
}

describe("createQuoteSchema — quoteType", () => {
  it("acepta una cotización Climatisa sin los campos de Cento", () => {
    const result = createQuoteSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it("por defecto (sin enviar quoteType) se comporta como Climatisa", () => {
    const withoutType: Record<string, unknown> = baseInput();
    delete withoutType.quoteType;
    const result = createQuoteSchema.safeParse(withoutType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quoteType).toBe("CLIMATISA");
    }
  });

  it("rechaza una cotización Cento sin vendedor de Cento ni referencia de cliente final", () => {
    const result = createQuoteSchema.safeParse(baseInput({ quoteType: "CENTO" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("centoVendorName");
      expect(paths).toContain("centoClientReference");
    }
  });

  it("rechaza una cotización Cento con solo uno de los dos campos", () => {
    const result = createQuoteSchema.safeParse(
      baseInput({ quoteType: "CENTO", centoVendorName: "Ana" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("centoClientReference");
      expect(paths).not.toContain("centoVendorName");
    }
  });

  it("rechaza campos de Cento con solo espacios en blanco (no cuenta como lleno)", () => {
    const result = createQuoteSchema.safeParse(
      baseInput({ quoteType: "CENTO", centoVendorName: "   ", centoClientReference: "   " }),
    );
    expect(result.success).toBe(false);
  });

  it("acepta una cotización Cento con ambos campos completos", () => {
    const result = createQuoteSchema.safeParse(
      baseInput({
        quoteType: "CENTO",
        centoVendorName: "Ana López",
        centoClientReference: "Ferretería El Progreso",
      }),
    );
    expect(result.success).toBe(true);
  });
});
