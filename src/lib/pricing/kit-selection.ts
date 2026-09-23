export interface InstallationKitRange {
  id: string;
  minMeters: number;
  maxMeters: number | null;
  price: number;
  // Tarifa de socio/distribuidor (cotizaciones Cento). Opcional para no
  // romper construcciones existentes de este tipo (ej. en pruebas) que no
  // la necesitan — la selección por metros no depende de este campo.
  partnerPrice?: number;
  active: boolean;
}

// Regla del skill (sección 32/43): dado un número de metros, encontrar el
// primer rango [minMeters, maxMeters) que lo contiene. maxMeters null = sin
// límite superior. Solo se consideran kits activos.
export function selectInstallationKit(
  meters: number,
  kits: InstallationKitRange[],
): InstallationKitRange {
  if (meters < 0) {
    throw new Error("Los metros no pueden ser negativos");
  }

  const match = kits
    .filter((kit) => kit.active)
    .find((kit) => meters >= kit.minMeters && (kit.maxMeters === null || meters < kit.maxMeters));

  if (!match) {
    throw new Error(`No hay un kit de instalación configurado para ${meters} metros`);
  }

  return match;
}

// Valida que un conjunto de rangos de kits no se solape. Se usa al crear o
// editar kits desde administración (sección 32: "No permitir que existan
// rangos superpuestos"). Ignora kits inactivos.
export function findOverlappingKitRanges(
  kits: InstallationKitRange[],
): [InstallationKitRange, InstallationKitRange][] {
  const active = kits.filter((kit) => kit.active).sort((a, b) => a.minMeters - b.minMeters);
  const overlaps: [InstallationKitRange, InstallationKitRange][] = [];

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const aMax = a.maxMeters ?? Infinity;
      const bMax = b.maxMeters ?? Infinity;
      const rangesOverlap = a.minMeters < bMax && b.minMeters < aMax;
      if (rangesOverlap) {
        overlaps.push([a, b]);
      }
    }
  }

  return overlaps;
}
