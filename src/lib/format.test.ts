import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/format";

describe("formatCurrency", () => {
  it("formatea con separador de miles y dos decimales", () => {
    expect(formatCurrency(1234)).toBe("Q 1,234.00");
  });

  it("formatea valores con centavos", () => {
    expect(formatCurrency(1234.5)).toBe("Q 1,234.50");
  });

  it("acepta strings numéricos", () => {
    expect(formatCurrency("500")).toBe("Q 500.00");
  });

  it("formatea cero", () => {
    expect(formatCurrency(0)).toBe("Q 0.00");
  });

  it("formatea negativos con el signo antes de Q", () => {
    expect(formatCurrency(-100)).toBe("-Q 100.00");
  });
});
