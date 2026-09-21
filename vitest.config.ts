import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // tsconfig.json usa "jsx": "preserve" a propósito (next.js implementa su
  // propio transform de JSX y revierte cualquier otro valor al correr
  // `next lint`) — Vitest usa el transform "oxc" de Vite y por defecto
  // hereda ese "preserve" del tsconfig, dejando el JSX sin transformar.
  // Forzar el runtime automático aquí, sin tocar tsconfig.json.
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    environment: "node",
  },
});
