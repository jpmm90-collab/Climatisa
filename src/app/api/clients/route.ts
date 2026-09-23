import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { clientSchema } from "@/lib/validations/client";
import { CENTO_CLIENT_ID } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  const clients = await prisma.client.findMany({
    where: {
      // El cliente fijo de Cento (extensión confirmada, ver CLAUDE.md)
      // nunca debe aparecer en este buscador — es exclusivo del flujo de
      // cotización tipo Cento, nunca elegible como cliente final normal.
      // Excluido aquí, en el servidor, para que ningún consumidor futuro
      // de este endpoint pueda olvidar filtrarlo por su cuenta.
      id: { not: CENTO_CLIENT_ID },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
              { company: { contains: q, mode: "insensitive" as const } },
              { nit: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const client = await prisma.client.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      company: parsed.data.company,
      nit: parsed.data.nit,
      address: parsed.data.address || null,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
