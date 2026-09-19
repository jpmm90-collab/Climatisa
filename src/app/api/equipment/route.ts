import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth-guard";
import { equipmentSchema } from "@/lib/validations/equipment";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const equipment = await prisma.equipment.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ equipment });
}

export async function POST(request: NextRequest) {
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

  const equipment = await prisma.equipment.create({ data: parsed.data });
  return NextResponse.json({ equipment }, { status: 201 });
}
