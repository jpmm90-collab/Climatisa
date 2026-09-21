import { describe, expect, it } from "vitest";
import { getGuatemalaYear } from "@/lib/quote-number";

describe("getGuatemalaYear", () => {
  it("usa el año de Guatemala, no el de UTC, en la ventana crítica de fin de año", () => {
    // 31 de diciembre 2026, 23:00 hora de Guatemala (UTC-6) = 1 de enero
    // 2027, 05:00 UTC. Si el cálculo usara UTC directamente (p. ej.
    // `new Date().getFullYear()` en un servidor con reloj en UTC, como
    // Vercel/Railway), esto daría 2027 incorrectamente.
    const almostMidnightGuatemala = new Date("2027-01-01T05:00:00.000Z");
    expect(getGuatemalaYear(almostMidnightGuatemala)).toBe(2026);
  });

  it("cambia a 2027 justo después de medianoche en Guatemala", () => {
    // 1 de enero 2027, 00:01 hora de Guatemala = 06:01 UTC.
    const justAfterMidnightGuatemala = new Date("2027-01-01T06:01:00.000Z");
    expect(getGuatemalaYear(justAfterMidnightGuatemala)).toBe(2027);
  });

  it("toda la ventana de 6 horas (18:00-23:59 Guatemala del 31 dic) sigue siendo el año viejo", () => {
    // 31 dic 2026, 18:00 Guatemala = 1 enero 2027, 00:00 UTC.
    const sixPmGuatemala = new Date("2027-01-01T00:00:00.000Z");
    expect(getGuatemalaYear(sixPmGuatemala)).toBe(2026);
  });

  it("una fecha bien dentro del año da ese mismo año", () => {
    expect(getGuatemalaYear(new Date("2026-06-15T12:00:00.000Z"))).toBe(2026);
  });

  it("el año por defecto (sin argumento) corresponde a hoy en Guatemala", () => {
    const expected = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Guatemala",
      year: "numeric",
    }).format(new Date());
    expect(getGuatemalaYear()).toBe(Number(expected));
  });
});
