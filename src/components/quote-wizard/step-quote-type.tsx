"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, Handshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { CENTO_CLIENT_ID, CENTO_CLIENT_NAME } from "@/lib/constants";
import type { QuoteType } from "@/lib/quote-wizard/types";

// Primer paso del asistente (extensión confirmada al skill, ver
// CLAUDE.md): decide todo lo que sigue. Cento es un socio comercial único
// y fijo — su cliente nunca se busca ni se crea, es un registro sembrado
// una sola vez, así que aquí mismo se resuelve y se asigna.
export function StepQuoteType() {
  const { state, update } = useQuoteWizard();
  const [loadingCento, setLoadingCento] = useState(false);

  const chooseClimatisa = () => {
    update({
      quoteType: "CLIMATISA",
      client: null,
      centoVendorName: "",
      centoClientReference: "",
      step: "client",
    });
  };

  const chooseCento = async () => {
    setLoadingCento(true);
    try {
      const res = await fetch(`/api/clients/${CENTO_CLIENT_ID}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.client) {
        toast.error("No se pudo cargar el cliente fijo de Cento. Intenta de nuevo.");
        return;
      }
      update({
        quoteType: "CENTO" as QuoteType,
        client: {
          id: data.client.id,
          name: data.client.name,
          phone: data.client.phone,
          nit: data.client.nit,
        },
        step: "cento-info",
      });
    } catch {
      toast.error("No se pudo conectar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setLoadingCento(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">¿Para quién es esta cotización?</h1>
        <p className="text-sm text-muted-foreground">Esto define el cliente y cómo se cobra el equipo.</p>
      </div>

      <Card
        className={`cursor-pointer transition-colors hover:bg-muted/50 ${state.quoteType === "CLIMATISA" ? "border-primary" : ""}`}
        onClick={chooseClimatisa}
      >
        <CardContent className="flex items-center gap-3 py-4">
          <Building2 className="size-6 text-muted-foreground" />
          <div>
            <p className="font-medium">Climatisa</p>
            <p className="text-sm text-muted-foreground">Cliente final — flujo normal, precios completos.</p>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`cursor-pointer transition-colors hover:bg-muted/50 ${state.quoteType === "CENTO" ? "border-primary" : ""} ${loadingCento ? "pointer-events-none opacity-60" : ""}`}
        onClick={chooseCento}
      >
        <CardContent className="flex items-center gap-3 py-4">
          <Handshake className="size-6 text-muted-foreground" />
          <div>
            <p className="font-medium">{CENTO_CLIENT_NAME}</p>
            <p className="text-sm text-muted-foreground">
              {loadingCento
                ? "Cargando..."
                : "Socio comercial — equipo ya suministrado, solo se cobra instalación a tarifa de socio."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
