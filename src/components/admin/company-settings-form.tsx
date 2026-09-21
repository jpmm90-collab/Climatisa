"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { FieldCharCount } from "@/components/ui/field-char-count";
import { companySettingsSchema, type CompanySettingsInput } from "@/lib/validations/company-settings";
import { TEXT_LIMITS } from "@/lib/constants";

const DEFAULTS: CompanySettingsInput = {
  companyName: "",
  logoUrl: "",
  phone: "",
  email: "",
  address: "",
  commercialTerms: "",
  defaultDepositPercentage: 50,
};

export function CompanySettingsForm({
  initialSettings,
}: {
  initialSettings: CompanySettingsInput | null;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: initialSettings ?? DEFAULTS,
  });

  const commercialTermsValue = watch("commercialTerms") ?? "";

  const onSubmit = async (values: CompanySettingsInput) => {
    const response = await fetch("/api/company-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toast.error(data?.error ?? "No se pudo guardar. Intenta de nuevo.");
      return;
    }

    toast.success("Datos de la empresa guardados");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="companyName">Nombre de la empresa</FieldLabel>
          <Input id="companyName" {...register("companyName")} />
          <FieldError errors={[errors.companyName]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="logoUrl">URL del logo (opcional)</FieldLabel>
          <Input id="logoUrl" placeholder="https://..." {...register("logoUrl")} />
          <FieldDescription>
            El logo se administra por URL (sección 43). Si se deja vacío, se usa el logo por defecto del
            proyecto.
          </FieldDescription>
          <FieldError errors={[errors.logoUrl]} />
        </Field>

        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
            <Input id="phone" {...register("phone")} />
            <FieldError errors={[errors.phone]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Correo</FieldLabel>
            <Input id="email" type="email" {...register("email")} />
            <FieldError errors={[errors.email]} />
          </Field>
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Dirección</FieldLabel>
          <Textarea id="address" rows={2} {...register("address")} />
          <FieldError errors={[errors.address]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="commercialTerms">Condiciones comerciales (opcional)</FieldLabel>
          <Textarea id="commercialTerms" rows={4} {...register("commercialTerms")} />
          <FieldCharCount value={commercialTermsValue} limit={TEXT_LIMITS.commercialTerms} />
          <FieldDescription>Aparece al final del PDF cuando está configurada.</FieldDescription>
          <FieldError errors={[errors.commercialTerms]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="defaultDepositPercentage">Anticipo predeterminado (%)</FieldLabel>
          <Input
            id="defaultDepositPercentage"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            {...register("defaultDepositPercentage", { valueAsNumber: true })}
          />
          <FieldDescription>
            El cotizador puede cambiarlo por cotización; este es solo el valor inicial sugerido.
          </FieldDescription>
          <FieldError errors={[errors.defaultDepositPercentage]} />
        </Field>

        <Button type="submit" size="lg" className="h-14 text-base" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
