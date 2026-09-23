"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { complexitySchema, type ComplexityInput } from "@/lib/validations/complexity";
import { formatCurrency } from "@/lib/format";

interface ComplexityRow extends ComplexityInput {
  id: string;
}

export function ComplexityTable({ initialComplexities }: { initialComplexities: ComplexityRow[] }) {
  const [complexities, setComplexities] = useState(initialComplexities);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ComplexityRow | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ComplexityInput>({
    resolver: zodResolver(complexitySchema),
    defaultValues: { level: 1, name: "", description: "", adjustment: 0, partnerAdjustment: 0, active: true },
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    reset({ level: 1, name: "", description: "", adjustment: 0, partnerAdjustment: 0, active: true });
    setOpen(true);
  };

  const openEdit = (row: ComplexityRow) => {
    setEditing(row);
    setServerError(null);
    reset(row);
    setOpen(true);
  };

  const onSubmit = async (values: ComplexityInput) => {
    setServerError(null);
    const url = editing ? `/api/complexities/${editing.id}` : "/api/complexities";
    const method = editing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setServerError(data?.error ?? "No se pudo guardar la complejidad");
      return;
    }

    const { complexity: saved } = await response.json();

    setComplexities((prev) => {
      if (editing) {
        return prev.map((item) => (item.id === saved.id ? saved : item));
      }
      return [...prev, saved].sort((a, b) => a.level - b.level);
    });

    toast.success("Complejidad guardada");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={openCreate} className="w-full gap-2">
        <Plus className="size-4" />
        Agregar complejidad
      </Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nivel</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Ajuste</TableHead>
            <TableHead>Ajuste socio (Cento)</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {complexities.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.level}</TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{formatCurrency(item.adjustment)}</TableCell>
              <TableCell>{formatCurrency(item.partnerAdjustment)}</TableCell>
              <TableCell>
                <Badge variant={item.active ? "default" : "secondary"}>
                  {item.active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Editar">
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
            <DialogTitle>{editing ? "Editar complejidad" : "Agregar complejidad"}</DialogTitle>
            <DialogDescription>
              El cotizador solo ve el nombre y la descripción, nunca el ajuste en quetzales.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="level">Nivel</FieldLabel>
                  <Input id="level" type="number" inputMode="numeric" {...register("level", { valueAsNumber: true })} />
                  <FieldError errors={[errors.level]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="name">Nombre</FieldLabel>
                  <Input id="name" placeholder="Sencilla, Media, Compleja..." {...register("name")} />
                  <FieldError errors={[errors.name]} />
                </Field>
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Descripción</FieldLabel>
                <Textarea id="description" rows={2} {...register("description")} />
                <FieldError errors={[errors.description]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="adjustment">Ajuste (Q)</FieldLabel>
                <Input id="adjustment" type="number" step="0.01" inputMode="decimal" {...register("adjustment", { valueAsNumber: true })} />
                <FieldError errors={[errors.adjustment]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="partnerAdjustment">Ajuste de socio — Cento (Q)</FieldLabel>
                <Input
                  id="partnerAdjustment"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  {...register("partnerAdjustment", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.partnerAdjustment]} />
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
