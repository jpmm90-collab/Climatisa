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
import { equipmentSchema, type EquipmentInput } from "@/lib/validations/equipment";
import { formatCurrency } from "@/lib/format";

interface EquipmentRow extends EquipmentInput {
  id: string;
}

export function EquipmentTable({ initialEquipment }: { initialEquipment: EquipmentRow[] }) {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentRow | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentInput>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: { name: "", brand: "", model: "", btu: 12000, type: "", price: 0, active: true },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", brand: "", model: "", btu: 12000, type: "", price: 0, active: true });
    setOpen(true);
  };

  const openEdit = (row: EquipmentRow) => {
    setEditing(row);
    reset(row);
    setOpen(true);
  };

  const onSubmit = async (values: EquipmentInput) => {
    const url = editing ? `/api/equipment/${editing.id}` : "/api/equipment";
    const method = editing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      toast.error("No se pudo guardar el equipo");
      return;
    }

    const { equipment: saved } = await response.json();
    setEquipment((prev) => {
      if (editing) {
        return prev.map((item) => (item.id === saved.id ? saved : item));
      }
      return [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
    });

    toast.success("Equipo guardado");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={openCreate} className="w-full gap-2">
        <Plus className="size-4" />
        Agregar equipo
      </Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Marca / Modelo</TableHead>
            <TableHead>BTU</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                {item.brand} / {item.model}
              </TableCell>
              <TableCell>{item.btu.toLocaleString()}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{formatCurrency(item.price)}</TableCell>
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
            <DialogTitle>{editing ? "Editar equipo" : "Agregar equipo"}</DialogTitle>
            <DialogDescription>El usuario del cotizador nunca ve ni escribe este precio.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nombre</FieldLabel>
                <Input id="name" {...register("name")} />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="brand">Marca</FieldLabel>
                  <Input id="brand" {...register("brand")} />
                  <FieldError errors={[errors.brand]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="model">Modelo</FieldLabel>
                  <Input id="model" {...register("model")} />
                  <FieldError errors={[errors.model]} />
                </Field>
              </Field>

              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="btu">BTU</FieldLabel>
                  <Input id="btu" type="number" inputMode="numeric" {...register("btu", { valueAsNumber: true })} />
                  <FieldError errors={[errors.btu]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="type">Tipo</FieldLabel>
                  <Input id="type" placeholder="Split, Cassette..." {...register("type")} />
                  <FieldError errors={[errors.type]} />
                </Field>
              </Field>

              <Field>
                <FieldLabel htmlFor="price">Precio (Q)</FieldLabel>
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
