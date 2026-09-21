import { Prisma } from "@prisma/client";

// Único punto de conversión Decimal -> number en todo el proyecto. Prisma
// serializa los campos Decimal como STRING en JSON (Prisma.Decimal.toJSON()),
// nunca como number. Cualquier código que lea un campo Decimal desde una
// respuesta de API (en vez de directamente desde Prisma en un server
// component) DEBE pasar por aquí. Ver sección 29/31 del skill: la misma
// disciplina que exige para el motor de precios aplica a esta deserialización
// — un solo punto de conversión, no un `Number(x)` repetido en cada
// componente que se pueda olvidar.
export function toNumber(value: Prisma.Decimal | number | string): number {
  return typeof value === "number" ? value : Number(value);
}

export function toNullableNumber(
  value: Prisma.Decimal | number | string | null,
): number | null {
  return value === null ? null : toNumber(value);
}
