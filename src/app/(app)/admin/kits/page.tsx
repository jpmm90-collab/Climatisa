import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { KitsTable } from "@/components/admin/kits-table";

export const dynamic = "force-dynamic";

export default async function KitsAdminPage() {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    redirect("/");
  }

  const kits = await prisma.installationKit.findMany({ orderBy: { minMeters: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Kits de instalación</h1>
        <p className="text-sm text-muted-foreground">Rangos de metros y su precio de kit.</p>
      </div>

      <KitsTable
        initialKits={kits.map((kit) => ({
          id: kit.id,
          minMeters: Number(kit.minMeters),
          maxMeters: kit.maxMeters === null ? null : Number(kit.maxMeters),
          price: Number(kit.price),
          active: kit.active,
        }))}
      />
    </div>
  );
}
