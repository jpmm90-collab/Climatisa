import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { installationKitSchema } from "@/lib/validations/installation-kit";
import { findOverlappingKitRanges, type InstallationKitRange } from "@/lib/pricing/kit-selection";
import { serializeInstallationKit } from "@/lib/serializers";
import { toNullableNumber, toNumber } from "@/lib/decimal";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = installationKitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const existingKit = await prisma.installationKit.findUnique({ where: { id: params.id } });
  if (!existingKit) {
    return NextResponse.json({ error: "Kit no encontrado" }, { status: 404 });
  }

  if (parsed.data.active) {
    const others = await prisma.installationKit.findMany({
      where: { active: true, id: { not: params.id } },
    });
    const candidate: InstallationKitRange = { id: params.id, ...parsed.data };
    const overlaps = findOverlappingKitRanges([
      ...others.map((k) => ({
        id: k.id,
        minMeters: toNumber(k.minMeters),
        maxMeters: toNullableNumber(k.maxMeters),
        price: toNumber(k.price),
        active: k.active,
      })),
      candidate,
    ]);

    if (overlaps.length > 0) {
      return NextResponse.json(
        { error: "El rango se solapa con un kit existente" },
        { status: 400 },
      );
    }
  }

  const kit = await prisma.installationKit.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ kit: serializeInstallationKit(kit) });
}
