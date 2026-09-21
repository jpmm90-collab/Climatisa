"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { FieldCharCount } from "@/components/ui/field-char-count";
import { useQuoteWizard } from "@/components/quote-wizard/context";
import { WizardBackButton } from "@/components/quote-wizard/wizard-back-button";
import { resetWizard } from "@/components/quote-wizard/quote-wizard";
import { deriveQuote } from "@/lib/quote-wizard/derive";
import { formatCurrency } from "@/lib/format";
import { INSTALLATION_BASE_TEXT, TEXT_LIMITS, VENDEDOR_RESPONSABLE } from "@/lib/constants";

export function StepSummary() {
  const { state, update, editQuoteId } = useQuoteWizard();
  const router = useRouter();
  const quote = deriveQuote(state);
  const [generating, setGenerating] = useState(false);
  const isEditing = Boolean(editQuoteId);
  const overTextLimit = state.installationNotesExtra.length > TEXT_LIMITS.installationNotesExtra;

  const startOver = () => {
    resetWizard(editQuoteId);
    router.refresh();
    window.location.reload();
  };

  const generate = async () => {
    if (!state.client) return;
    setGenerating(true);

    try {
      const response = await fetch(isEditing ? `/api/quotes/${editQuoteId}` : "/api/quotes", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: state.client.id,
          areas: state.areas.map((area) => ({
            name: area.name,
            equipmentLines: area.equipmentLines.map((line) => ({
              // Presente solo si el usuario no tocó esta línea (sección 43):
              // le indica al servidor que conserve el snapshot tal cual, sin
              // recalcular con precios vigentes.
              sourceLineId: line.sourceLineId,
              equipmentId: line.equipmentId,
              quantity: line.quantity,
              meters: line.meters,
              complexityId: line.complexityId,
            })),
          })),
          extras: state.extras.map((extra) => ({ description: extra.description, price: extra.price })),
          discountType: state.discountType,
          discountValue: state.discountValue,
          depositPercentage: state.depositPercentage,
          additionalDescription: state.additionalDescription,
          installationNotesExtra: state.installationNotesExtra,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(
          data?.error ??
            `No se pudo ${isEditing ? "guardar" : "generar"} la cotización. Tus datos siguen aquí, intenta de nuevo.`,
        );
        return;
      }

      const { quote: saved } = await response.json();
      resetWizard(editQuoteId);
      toast.success(isEditing ? `Cotización ${saved.quoteNumber} actualizada` : `Cotización ${saved.quoteNumber} generada`);
      router.push(`/cotizaciones/${saved.id}`);
    } catch {
      // Sin conexión, tiempo de espera agotado, etc. — el borrador NO se
      // borra (solo se limpia tras una respuesta exitosa del servidor), así
      // que los datos ya ingresados no se pierden. Avisar claramente en vez
      // de fallar en silencio (skill, sección PWA: "si no hay conexión,
      // decirlo claramente").
      toast.error("No se pudo conectar. Revisa tu conexión e intenta de nuevo — no perdiste nada.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="text-sm text-muted-foreground">
          {isEditing ? "Revisa los cambios antes de guardar." : "Revisa todo antes de generar la cotización."}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1 py-4">
          <p className="font-medium">{state.client?.name}</p>
          <p className="text-sm text-muted-foreground">Tel. {state.client?.phone}</p>
          <p className="text-sm text-muted-foreground">NIT: {state.client?.nit}</p>
          <p className="text-sm text-muted-foreground">Vendedor: {VENDEDOR_RESPONSABLE}</p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {quote.areas.map((area) => (
          <Card key={area.areaId}>
            <CardContent className="flex flex-col gap-2 py-4">
              <p className="font-medium">{area.name}</p>
              {area.lines.map((line, index) => {
                const source = state.areas.find((a) => a.areaId === area.areaId)?.equipmentLines[index];
                return (
                  <div key={line.lineId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {source?.equipmentName}
                      {source && source.quantity > 1 ? ` × ${source.quantity}` : ""}
                    </span>
                    <span>{formatCurrency(line.lineTotal)}</span>
                  </div>
                );
              })}
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span>Total área</span>
                <span>{formatCurrency(area.areaTotal)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <p className="font-medium">Instalación</p>
          {/* Texto base obligatorio (sección 19.5): siempre presente, no editable.
              El usuario solo puede agregar una aclaración aparte, nunca tocar este texto. */}
          <p className="text-sm text-muted-foreground">{INSTALLATION_BASE_TEXT}</p>
          <Field>
            <FieldLabel htmlFor="installation-notes-extra">
              Información adicional sobre la instalación (opcional)
            </FieldLabel>
            <Textarea
              id="installation-notes-extra"
              rows={2}
              placeholder="Agregar información adicional..."
              value={state.installationNotesExtra}
              onChange={(e) => update({ installationNotesExtra: e.target.value })}
            />
            <FieldCharCount value={state.installationNotesExtra} limit={TEXT_LIMITS.installationNotesExtra} />
          </Field>
        </CardContent>
      </Card>

      {state.extras.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="font-medium">Extras</p>
            {state.extras.map((extra) => (
              <div key={extra.extraId} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{extra.description}</span>
                <span>{formatCurrency(extra.price)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {state.additionalDescription ? (
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="font-medium">Observaciones</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.additionalDescription}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-1 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(quote.subtotal)}</span>
          </div>
          {quote.discountAmount > 0 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Descuento</span>
              <span>- {formatCurrency(quote.discountAmount)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-xl font-semibold">
            <span>Total</span>
            <span>{formatCurrency(quote.total)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex items-center justify-between text-sm">
            <span>Anticipo ({state.depositPercentage}%)</span>
            <span>{formatCurrency(quote.depositAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Saldo</span>
            <span>{formatCurrency(quote.balance)}</span>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="h-14 gap-2 text-base" disabled={generating || overTextLimit} onClick={generate}>
        <Send className="size-5" />
        {generating
          ? isEditing
            ? "Guardando..."
            : "Generando..."
          : isEditing
            ? "Guardar cambios"
            : "Generar cotización"}
      </Button>

      <WizardBackButton />
      <Button variant="ghost" className="text-muted-foreground" onClick={startOver}>
        Cancelar y empezar de nuevo
      </Button>
    </div>
  );
}
