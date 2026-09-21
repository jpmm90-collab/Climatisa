"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { FieldCharCount } from "@/components/ui/field-char-count";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { clientSchema, type ClientInput } from "@/lib/validations/client";
import { setPendingSelectedClientId } from "@/lib/quote-wizard/storage";
import { TEXT_LIMITS } from "@/lib/constants";

export function ClientForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", company: "", nit: "", address: "" },
  });

  const nameValue = watch("name") ?? "";
  const companyValue = watch("company") ?? "";
  const addressValue = watch("address") ?? "";

  const onSubmit = async (values: ClientInput) => {
    setServerError(null);

    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      setServerError("No se pudo guardar el cliente. Intenta de nuevo.");
      return;
    }

    const { client } = await response.json();

    if (returnTo.startsWith("/cotizaciones/")) {
      setPendingSelectedClientId(client.id);
    }

    toast.success("Cliente guardado");
    router.push(returnTo);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="name">Nombre</FieldLabel>
          <Input id="name" autoFocus {...register("name")} />
          <FieldCharCount value={nameValue} limit={TEXT_LIMITS.clientName} />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
          <Input id="phone" type="tel" inputMode="tel" placeholder="5555-5555" {...register("phone")} />
          <FieldDescription>Si es de fuera de Guatemala, incluye el código de país (ej. +1 305 555 1234).</FieldDescription>
          <FieldError errors={[errors.phone]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="company">Empresa</FieldLabel>
          <Input id="company" {...register("company")} />
          <FieldCharCount value={companyValue} limit={TEXT_LIMITS.company} />
          <FieldError errors={[errors.company]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="nit">NIT</FieldLabel>
          <Input id="nit" placeholder="CF" {...register("nit")} />
          <FieldDescription>Si no tiene NIT, escribe CF.</FieldDescription>
          <FieldError errors={[errors.nit]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Dirección (opcional)</FieldLabel>
          <Textarea id="address" rows={2} {...register("address")} />
          <FieldCharCount value={addressValue} limit={TEXT_LIMITS.address} />
          <FieldError errors={[errors.address]} />
        </Field>

        <Button type="submit" size="lg" className="h-14 text-base" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cliente"}
        </Button>
      </FieldGroup>
    </form>
  );
}
