import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth-guard";
import { complexitySchema } from "@/lib/validations/complexity";
import { serializeComplexity } from "@/lib/serializers";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const complexities = await prisma.complexity.findMany({ orderBy: { level: "asc" } });
  return NextResponse.json({ complexities: complexities.map(serializeComplexity) });
}

export async function POST(request: NextRequest) {
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

  const duplicate = await prisma.complexity.findUnique({ where: { level: parsed.data.level } });
  if (duplicate) {
    return NextResponse.json({ error: "Ya existe una complejidad con ese nivel" }, { status: 400 });
  }

  const complexity = await prisma.complexity.create({ data: parsed.data });
  return NextResponse.json({ complexity: serializeComplexity(complexity) }, { status: 201 });
}
