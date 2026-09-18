# Climatisa — Cotizador de Aires Acondicionados

Andamiaje inicial para arrancar el proyecto con Claude Code. Ya incluye:

- `.claude/skills/cotizador-aires-acondicionados/SKILL.md` — el spec completo
  del producto, en formato de skill (Claude Code lo carga automáticamente
  cuando el trabajo coincide con su descripción).
- `CLAUDE.md` — reglas críticas que Claude Code lee siempre, en cada sesión,
  sin depender de que se dispare el skill.
- `public/branding/climatisa-logo.png` — logo de la empresa.

## 0. Prerrequisitos

- Node.js 20+ y npm.
- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`, o la
  app de escritorio de Claude, pestaña "Code").
- Una cuenta de **Neon** o **Supabase** para Postgres (elige una ahora y no
  la cambies después — el skill lo exige explícitamente). Si no tienes
  preferencia, Neon es la opción más simple porque solo da Postgres —
  Supabase trae más servicios (auth, storage) que este proyecto no usa,
  ya que la autenticación va con Auth.js/Credentials, no con Supabase Auth.

## 1. Arrancar el repo

```bash
cd climatisa-cotizador
git init
git add .
git commit -m "chore: scaffold inicial + skill del cotizador"
```

## 2. Primera sesión de Claude Code

Desde la raíz del repo:

```bash
claude
```

Y como primer mensaje (Fase 1 del skill — sección 39):

> Trabajando en este repo, sigue estrictamente el skill
> `cotizador-aires-acondicionados` y las reglas de `CLAUDE.md`.
>
> Implementa la Fase 1:
> 1. Inicializa Next.js 14 (App Router, TypeScript strict) con Tailwind y shadcn/ui.
> 2. Configura Prisma con [Neon | Supabase] Postgres — usa ese proveedor y créalo en el schema.prisma.
> 3. Implementa autenticación con Auth.js (Credentials Provider + bcrypt), con roles ADMIN y COTIZADOR.
> 4. Crea el layout móvil-first base, la pantalla de login y la pantalla de inicio (Crear cotización / Buscar cotización / Crear cliente), usando el logo en public/branding/.
> 5. Implementa el modelo Client y el flujo de crear/buscar cliente (NIT acepta "CF").
> 6. Agrega seed data de demostración (sección "Seed data" del skill).
> 7. Corre typecheck, lint, tests y build. No consideres la fase terminada si algo falla.
>
> No avances a la Fase 2 (equipos, kits, complejidades, pricing engine) sin confirmación.

## 3. Fases siguientes

El orden completo ya está definido en la sección 39 del skill:

1. Auth + layout móvil + dashboard + clientes
2. Equipos + kits + complejidades + pricing engine (con tests unitarios)
3. Creación de cotización: múltiples áreas, extras, descuentos, anticipo
4. Resumen + persistencia + número de cotización + PDF
5. Búsqueda de cotizaciones + edición + estados
6. Mejoras UX, validaciones, administración de parámetros, pruebas, optimización móvil

Pide a Claude Code una fase a la vez y valida (typecheck/lint/test/build)
antes de pedir la siguiente. Si algo del skill queda ambiguo para una
decisión de negocio, que Claude Code se detenga y pregunte en vez de asumir
— así está indicado en la última sección del skill.

## 4. Variables de entorno

Copia `.env.example` a `.env` y complétalo con tu `DATABASE_URL` (Neon o
Supabase) y un `NEXTAUTH_SECRET` generado con `openssl rand -base64 32`.
