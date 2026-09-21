import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ComplexityTable } from "@/components/admin/complexity-table";
import { serializeComplexity } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export default async function ComplejidadesAdminPage() {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    redirect("/");
  }

  const complexities = await prisma.complexity.findMany({ orderBy: { level: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Complejidades</h1>
        <p className="text-sm text-muted-foreground">Niveles de dificultad de instalación.</p>
      </div>

      <ComplexityTable initialComplexities={complexities.map(serializeComplexity)} />
    </div>
  );
}
