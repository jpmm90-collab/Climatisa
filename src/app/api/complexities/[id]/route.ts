import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { complexitySchema } from "@/lib/validations/complexity";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = complexitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const existing = await prisma.complexity.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Complejidad no encontrada" }, { status: 404 });
  }

  const duplicate = await prisma.complexity.findFirst({
    where: { level: parsed.data.level, id: { not: params.id } },
  });
  if (duplicate) {
    return NextResponse.json({ error: "Ya existe una complejidad con ese nivel" }, { status: 400 });
  }

  const complexity = await prisma.complexity.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ complexity });
}
