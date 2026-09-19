import { describe, expect, it } from "vitest";
import { clientSchema } from "@/lib/validations/client";

const base = {
  name: "Juan Pérez",
  phone: "5555-5555",
  company: "Empresa Demo",
  nit: "1234567-8",
  address: "3a calle 4-56 zona 1",
};

describe("clientSchema", () => {
  it("acepta un cliente válido con NIT numérico", () => {
    const result = clientSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("acepta CF como NIT explícitamente", () => {
    const result = clientSchema.safeParse({ ...base, nit: "CF" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nit).toBe("CF");
    }
  });

  it("acepta cf en minúsculas y lo normaliza a CF", () => {
    const result = clientSchema.safeParse({ ...base, nit: "cf" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nit).toBe("CF");
    }
  });

  it("rechaza NIT vacío", () => {
    const result = clientSchema.safeParse({ ...base, nit: "" });
    expect(result.success).toBe(false);
  });

  it("acepta teléfono sin guion", () => {
    const result = clientSchema.safeParse({ ...base, phone: "55555555" });
    expect(result.success).toBe(true);
  });

  it("rechaza teléfono demasiado corto", () => {
    const result = clientSchema.safeParse({ ...base, phone: "123" });
    expect(result.success).toBe(false);
  });

  it("rechaza nombre vacío", () => {
    const result = clientSchema.safeParse({ ...base, name: "" });
    expect(result.success).toBe(false);
  });

  it("permite dirección vacía (opcional)", () => {
    const result = clientSchema.safeParse({ ...base, address: "" });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre mayor a 120 caracteres", () => {
    const result = clientSchema.safeParse({ ...base, name: "a".repeat(121) });
    expect(result.success).toBe(false);
  });
});
