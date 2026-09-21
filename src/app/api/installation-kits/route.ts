import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth-guard";
import { installationKitSchema } from "@/lib/validations/installation-kit";
import { findOverlappingKitRanges, type InstallationKitRange } from "@/lib/pricing/kit-selection";
import { serializeInstallationKit } from "@/lib/serializers";
import { toNullableNumber, toNumber } from "@/lib/decimal";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const kits = await prisma.installationKit.findMany({ orderBy: { minMeters: "asc" } });
  return NextResponse.json({ kits: kits.map(serializeInstallationKit) });
}

export async function POST(request: NextRequest) {
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

  if (parsed.data.active) {
    const existing = await prisma.installationKit.findMany({ where: { active: true } });
    const candidate: InstallationKitRange = { id: "new", ...parsed.data };
    const overlaps = findOverlappingKitRanges([
      ...existing.map((k) => ({
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

  const kit = await prisma.installationKit.create({ data: parsed.data });
  return NextResponse.json({ kit: serializeInstallationKit(kit) }, { status: 201 });
}
