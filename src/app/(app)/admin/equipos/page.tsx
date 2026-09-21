import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EquipmentTable } from "@/components/admin/equipment-table";
import { serializeEquipment } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export default async function EquiposAdminPage() {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    redirect("/");
  }

  const equipment = await prisma.equipment.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Equipos</h1>
        <p className="text-sm text-muted-foreground">Catálogo de equipos y sus precios.</p>
      </div>

      <EquipmentTable initialEquipment={equipment.map(serializeEquipment)} />
    </div>
  );
}
