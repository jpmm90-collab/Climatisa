"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { installationKitSchema, type InstallationKitInput } from "@/lib/validations/installation-kit";
import { formatCurrency } from "@/lib/format";

interface KitRow extends InstallationKitInput {
  id: string;
}

export function KitsTable({ initialKits }: { initialKits: KitRow[] }) {
  const [kits, setKits] = useState(initialKits);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KitRow | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InstallationKitInput>({
    resolver: zodResolver(installationKitSchema),
    defaultValues: { minMeters: 0, maxMeters: 5, price: 0, active: true },
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    reset({ minMeters: 0, maxMeters: 5, price: 0, active: true });
    setOpen(true);
  };

  const openEdit = (row: KitRow) => {
    setEditing(row);
    setServerError(null);
    reset(row);
    setOpen(true);
  };

  const onSubmit = async (values: InstallationKitInput) => {
    setServerError(null);
    const url = editing ? `/api/installation-kits/${editing.id}` : "/api/installation-kits";
    const method = editing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setServerError(data?.error ?? "No se pudo guardar el kit");
      return;
    }

    const { kit: saved } = await response.json();
    const normalized: KitRow = {
      id: saved.id,
      minMeters: Number(saved.minMeters),
      maxMeters: saved.maxMeters === null ? null : Number(saved.maxMeters),
      price: Number(saved.price),
      active: saved.active,
    };

    setKits((prev) => {
      if (editing) {
        return prev.map((item) => (item.id === normalized.id ? normalized : item));
      }
      return [...prev, normalized].sort((a, b) => a.minMeters - b.minMeters);
    });

    toast.success("Kit guardado");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={openCreate} className="w-full gap-2">
        <Plus className="size-4" />
        Agregar kit
      </Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Desde (m)</TableHead>
            <TableHead>Hasta (m)</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {kits.map((kit) => (
            <TableRow key={kit.id}>
              <TableCell>{kit.minMeters}</TableCell>
              <TableCell>{kit.maxMeters === null ? "Sin límite" : kit.maxMeters}</TableCell>
              <TableCell>{formatCurrency(kit.price)}</TableCell>
              <TableCell>
                <Badge variant={kit.active ? "default" : "secondary"}>
                  {kit.active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => openEdit(kit)} aria-label="Editar">
                  <Pencil className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar kit" : "Agregar kit"}</DialogTitle>
            <DialogDescription>
              El sistema elige el kit automáticamente según los metros que ingrese el cotizador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="minMeters">Desde (metros)</FieldLabel>
                  <Input id="minMeters" type="number" step="0.01" inputMode="decimal" {...register("minMeters", { valueAsNumber: true })} />
                  <FieldError errors={[errors.minMeters]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="maxMeters">Hasta (metros)</FieldLabel>
                  <Controller
                    control={control}
                    name="maxMeters"
                    render={({ field }) => (
                      <Input
                        id="maxMeters"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Sin límite"
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    )}
                  />
                  <FieldError errors={[errors.maxMeters]} />
                </Field>
              </Field>

              <Field>
                <FieldLabel htmlFor="price">Precio del kit (Q)</FieldLabel>
                <Input id="price" type="number" step="0.01" inputMode="decimal" {...register("price", { valueAsNumber: true })} />
                <FieldError errors={[errors.price]} />
              </Field>

              <Field orientation="horizontal">
                <FieldLabel htmlFor="active">Activo</FieldLabel>
                <Controller
                  control={control}
                  name="active"
                  render={({ field }) => (
                    <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </Field>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
