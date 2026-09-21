"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuoteWizard } from "@/components/quote-wizard/context";

interface ClientResult {
  id: string;
  name: string;
  phone: string;
  nit: string;
}

export function StepClient() {
  const { state, update, goNext } = useQuoteWizard();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (state.client) return;

    const timeout = setTimeout(() => {
      setSearching(true);
      fetch(`/api/clients?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.clients ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, state.client]);

  if (state.client) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cliente</h1>
          <p className="text-sm text-muted-foreground">Este es el cliente para la cotización.</p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="font-medium">{state.client.name}</p>
              <p className="text-sm text-muted-foreground">{state.client.phone}</p>
              <p className="text-sm text-muted-foreground">NIT: {state.client.nit}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Quitar cliente"
              onClick={() => update({ client: null })}
            >
              <X className="size-4" />
            </Button>
          </CardContent>
        </Card>

        <Button size="lg" className="h-14 text-base" onClick={goNext}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Buscar cliente</h1>
        <p className="text-sm text-muted-foreground">Busca por nombre, teléfono, empresa o NIT.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre, teléfono, empresa o NIT"
          className="pl-9"
        />
      </div>

      <Button asChild variant="secondary" size="lg" className="h-14 gap-2 text-base">
        <Link href="/clientes/nuevo?returnTo=/cotizaciones/nueva">
          <UserPlus className="size-5" />
          Crear cliente
        </Link>
      </Button>

      <div className="flex flex-col gap-2">
        {searching ? <p className="text-center text-sm text-muted-foreground">Buscando...</p> : null}
        {!searching && query && results.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No se encontraron clientes.</p>
        ) : null}
        {results.map((client) => (
          <Card
            key={client.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => update({ client })}
          >
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
              <Check className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
