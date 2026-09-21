"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

const TRANSITIONS: Record<QuoteStatus, { status: QuoteStatus; label: string }[]> = {
  DRAFT: [
    { status: "SENT", label: "Marcar como enviada" },
    { status: "ACCEPTED", label: "Marcar como aceptada" },
    { status: "REJECTED", label: "Marcar como rechazada" },
  ],
  SENT: [
    { status: "ACCEPTED", label: "Marcar como aceptada" },
    { status: "REJECTED", label: "Marcar como rechazada" },
  ],
  ACCEPTED: [{ status: "REJECTED", label: "Marcar como rechazada" }],
  REJECTED: [{ status: "ACCEPTED", label: "Marcar como aceptada" }],
};

export function QuoteStatusActions({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<QuoteStatus | null>(null);

  const options = TRANSITIONS[status] ?? [];
  if (options.length === 0) return null;

  const setStatus = async (newStatus: QuoteStatus) => {
    setUpdating(newStatus);
    try {
      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        toast.error("No se pudo cambiar el estado. Intenta de nuevo.");
        return;
      }
      toast.success("Estado actualizado");
      router.refresh();
    } catch {
      toast.error("No se pudo conectar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <Button
          key={option.status}
          variant="secondary"
          disabled={updating !== null}
          onClick={() => setStatus(option.status)}
        >
          {updating === option.status ? "Actualizando..." : option.label}
        </Button>
      ))}
    </div>
  );
}
