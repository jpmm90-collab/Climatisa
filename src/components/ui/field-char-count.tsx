import { cn } from "@/lib/utils";

// Contador visible de caracteres, nunca truncado silencioso. El límite real
// siempre lo aplica Zod al enviar (error visible); esto es solo la señal
// temprana para que el usuario nunca pierda texto sin darse cuenta —
// especialmente al pegar un texto largo, que un `maxLength` de HTML
// recortaría sin avisar.
export function FieldCharCount({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <p className={cn("text-right text-xs text-muted-foreground", over && "font-medium text-destructive")}>
      {over ? `${value.length - limit} caracteres de más (máximo ${limit})` : `${value.length}/${limit}`}
    </p>
  );
}
