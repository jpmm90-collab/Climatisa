"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "borrador",
  SENT: "enviada",
  ACCEPTED: "aceptada",
  REJECTED: "rechazada",
};

export function EditQuoteButton({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const editHref = `/cotizaciones/${quoteId}/editar`;

  if (status === "DRAFT") {
    return (
      <Button asChild variant="secondary" size="lg" className="h-14 gap-2 text-base">
        <a href={editHref}>
          <Pencil className="size-5" />
          Editar
        </a>
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        className="h-14 gap-2 text-base"
        onClick={() => setConfirmOpen(true)}
      >
        <Pencil className="size-5" />
        Editar
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Esta cotización ya fue {STATUS_LABELS[status]}</DialogTitle>
            <DialogDescription>
              El cliente ya vio esta versión. ¿Seguro que quieres modificarla?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => router.push(editHref)}>Sí, editar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
