import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { equipmentSchema } from "@/lib/validations/equipment";
import { serializeEquipment } from "@/lib/serializers";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = equipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const existing = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  }

  const equipment = await prisma.equipment.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ equipment: serializeEquipment(equipment) });
}
