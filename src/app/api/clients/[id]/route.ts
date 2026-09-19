import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { clientSchema } from "@/lib/validations/client";

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
