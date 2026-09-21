"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuoteWizard } from "@/components/quote-wizard/context";

export function WizardBackButton({ onClick }: { onClick?: () => void }) {
  const { goBack } = useQuoteWizard();

  return (
    <Button variant="ghost" className="gap-1 self-start" onClick={onClick ?? goBack}>
      <ChevronLeft className="size-4" />
      Atrás
    </Button>
  );
}
