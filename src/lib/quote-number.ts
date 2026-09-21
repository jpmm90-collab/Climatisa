import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TIMEZONE } from "@/lib/constants";

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

// El año del número de cotización corresponde al año en America/Guatemala,
// NUNCA al año del servidor (sección 43). Guatemala es UTC-6 todo el año
// (sin horario de verano), así que entre las 18:00 y medianoche hora local
// del 31 de diciembre, UTC ya marca el año siguiente — una ventana de 6
// horas, todos los años, no un caso extremo de un segundo.
export function getGuatemalaYear(date: Date = new Date()): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
  }).format(date);
  return Number(formatted);
}

// Formato fijo: COT-2026-000123. Generado de forma atómica en Postgres vía
// INSERT ... ON CONFLICT DO UPDATE ... RETURNING (sección 43: "nunca usar
// count(*) + 1"). Esta es una única sentencia SQL — Postgres serializa el
// acceso a la fila afectada, así que dos llamadas concurrentes para el mismo
// año nunca pueden recibir el mismo número.
export async function generateQuoteNumber(
  date: Date = new Date(),
  client: PrismaClientOrTx = prisma,
): Promise<string> {
  const year = getGuatemalaYear(date);

  const rows = await client.$queryRaw<{ last_number: number }[]>(Prisma.sql`
    INSERT INTO quote_number_counters (year, last_number)
    VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE SET last_number = quote_number_counters.last_number + 1
    RETURNING last_number
  `);

  const sequence = rows[0].last_number;
  return `COT-${year}-${String(sequence).padStart(6, "0")}`;
}
