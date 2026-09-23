import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { clientSchema } from "@/lib/validations/client";
import { CENTO_CLIENT_ID } from "@/lib/constants";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({ where: { id: params.id } });

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ client });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // El cliente fijo de Cento (extensión confirmada, ver CLAUDE.md) no se
  // puede editar desde este endpoint bajo ninguna circunstancia — mismo
  // cuidado que la sección 43 exige para VENDEDOR_RESPONSABLE. No hay hoy
  // una pantalla de edición de clientes en la UI, pero este endpoint ya
  // existe y quedaría expuesto en cuanto se agregue una; el bloqueo va
  // aquí, en el backend, no solo ocultando un botón en el frontend.
  if (params.id === CENTO_CLIENT_ID) {
    return NextResponse.json(
      { error: "El cliente fijo de Cento no se puede editar" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const existing = await prisma.client.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      company: parsed.data.company,
      nit: parsed.data.nit,
      address: parsed.data.address || null,
    },
  });

  return NextResponse.json({ client });
}
