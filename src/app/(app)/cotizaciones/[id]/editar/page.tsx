import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuoteWizard } from "@/components/quote-wizard/quote-wizard";

export default async function EditarCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const exists = await prisma.quote.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    notFound();
  }

  return <QuoteWizard editQuoteId={id} />;
}
