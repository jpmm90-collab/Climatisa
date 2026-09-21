import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { toNullableNumber, toNumber } from "@/lib/decimal";

describe("toNumber", () => {
  it("convierte un Prisma.Decimal a number", () => {
    expect(toNumber(new Prisma.Decimal("300.50"))).toBe(300.5);
  });

  it("convierte el string que produce JSON.stringify de un Decimal", () => {
    // Esto reproduce el bug real: Prisma.Decimal.toJSON() devuelve un
    // string, así que después de `NextResponse.json()` + `fetch().json()`
    // el valor llega como string, no como Decimal ni como number.
    const decimal = new Prisma.Decimal("300");
    const roundTripped = JSON.parse(JSON.stringify({ price: decimal })).price;
    expect(typeof roundTripped).toBe("string");
    expect(toNumber(roundTripped)).toBe(300);
  });

  it("dos valores convertidos con toNumber se suman en vez de concatenarse", () => {
    const kitPrice = toNumber(JSON.parse(JSON.stringify(new Prisma.Decimal("300"))));
    const complexityAdjustment = toNumber(JSON.parse(JSON.stringify(new Prisma.Decimal("300"))));
    expect(kitPrice + complexityAdjustment).toBe(600);
  });

  it("deja pasar un number sin cambios", () => {
    expect(toNumber(42)).toBe(42);
  });
});

describe("toNullableNumber", () => {
  it("convierte null a null (sin límite superior de kit)", () => {
    expect(toNullableNumber(null)).toBeNull();
  });

  it("convierte un Decimal no nulo normalmente", () => {
    expect(toNullableNumber(new Prisma.Decimal("25"))).toBe(25);
  });
});
