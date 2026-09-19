import { describe, expect, it } from "vitest";
import {
  findOverlappingKitRanges,
  selectInstallationKit,
  type InstallationKitRange,
} from "@/lib/pricing/kit-selection";

const kits: InstallationKitRange[] = [
  { id: "k1", minMeters: 0, maxMeters: 5, price: 100, active: true },
  { id: "k2", minMeters: 5, maxMeters: 10, price: 200, active: true },
  { id: "k3", minMeters: 10, maxMeters: 15, price: 300, active: true },
  { id: "k4", minMeters: 15, maxMeters: null, price: 400, active: true },
  { id: "inactive", minMeters: 0, maxMeters: 5, price: 999, active: false },
];

describe("selectInstallationKit", () => {
  it("selecciona el rango correcto para un valor intermedio", () => {
    expect(selectInstallationKit(8, kits).id).toBe("k2");
  });

  it("el límite inferior es inclusivo", () => {
    expect(selectInstallationKit(5, kits).id).toBe("k2");
  });

  it("el límite superior es exclusivo", () => {
    expect(selectInstallationKit(4.99, kits).id).toBe("k1");
  });

  it("acepta 0 metros", () => {
    expect(selectInstallationKit(0, kits).id).toBe("k1");
  });

  it("el último rango no tiene límite superior", () => {
    expect(selectInstallationKit(1000, kits).id).toBe("k4");
  });

  it("ignora kits inactivos", () => {
    expect(selectInstallationKit(2, kits).id).toBe("k1");
  });

  it("lanza error para metros negativos", () => {
    expect(() => selectInstallationKit(-1, kits)).toThrow();
  });

  it("lanza error cuando no hay rango configurado (hueco)", () => {
    const gappedKits: InstallationKitRange[] = [
      { id: "a", minMeters: 0, maxMeters: 5, price: 100, active: true },
      { id: "b", minMeters: 10, maxMeters: 15, price: 200, active: true },
    ];
    expect(() => selectInstallationKit(7, gappedKits)).toThrow();
  });
});

describe("findOverlappingKitRanges", () => {
  it("no reporta solapes en rangos válidos y contiguos", () => {
    expect(findOverlappingKitRanges(kits)).toHaveLength(0);
  });

  it("detecta rangos solapados", () => {
    const overlapping: InstallationKitRange[] = [
      { id: "a", minMeters: 0, maxMeters: 10, price: 100, active: true },
      { id: "b", minMeters: 5, maxMeters: 15, price: 200, active: true },
    ];
    expect(findOverlappingKitRanges(overlapping)).toHaveLength(1);
  });

  it("detecta solape con un rango abierto (maxMeters null)", () => {
    const overlapping: InstallationKitRange[] = [
      { id: "a", minMeters: 10, maxMeters: null, price: 100, active: true },
      { id: "b", minMeters: 20, maxMeters: 25, price: 200, active: true },
    ];
    expect(findOverlappingKitRanges(overlapping)).toHaveLength(1);
  });

  it("ignora kits inactivos al buscar solapes", () => {
    const withInactive: InstallationKitRange[] = [
      { id: "a", minMeters: 0, maxMeters: 10, price: 100, active: true },
      { id: "b", minMeters: 5, maxMeters: 15, price: 200, active: false },
    ];
    expect(findOverlappingKitRanges(withInactive)).toHaveLength(0);
  });
});
