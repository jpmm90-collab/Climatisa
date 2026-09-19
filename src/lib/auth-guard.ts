import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// Autorización verificada en backend (no solo ocultando botones en el
// frontend — skill, sección 43 "Roles"). Devuelve la sesión de ADMIN o una
// respuesta 401/403 lista para retornar desde el route handler.
export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Solo un administrador puede hacer esto" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

export async function requireSession() {
  const session = await getSession();

  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  return { session, error: null };
}
