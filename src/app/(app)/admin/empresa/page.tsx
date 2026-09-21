import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CompanySettingsForm } from "@/components/admin/company-settings-form";

export const dynamic = "force-dynamic";

export default async function EmpresaAdminPage() {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    redirect("/");
  }

  const settings = await prisma.companySettings.findFirst();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Datos de la empresa</h1>
        <p className="text-sm text-muted-foreground">
          Se muestran siempre actuales en el PDF y las cotizaciones — no se congelan por cotización.
        </p>
      </div>

      <CompanySettingsForm
        initialSettings={
          settings
            ? {
                companyName: settings.companyName,
                logoUrl: settings.logoUrl ?? "",
                phone: settings.phone,
                email: settings.email,
                address: settings.address,
                commercialTerms: settings.commercialTerms ?? "",
                defaultDepositPercentage: Number(settings.defaultDepositPercentage),
              }
            : null
        }
      />
    </div>
  );
}
