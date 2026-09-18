# Climatisa — Cotizador de Aires Acondicionados

Este repo implementa el sistema descrito en el skill
`cotizador-aires-acondicionados` (`.claude/skills/cotizador-aires-acondicionados/SKILL.md`).
Ese archivo es la fuente principal de verdad del producto. Léelo por
completo antes de tocar código si no lo has hecho en esta sesión.

## No negociable (repetido aquí para que nunca se pierda de vista)

- Stack fijo: Next.js 14 (App Router) + TypeScript strict, Tailwind + shadcn/ui,
  PostgreSQL + Prisma, Auth.js (Credentials + bcrypt), `@react-pdf/renderer`
  server-side, Zod, React Hook Form, Vitest, Playwright. No Redux/Zustand,
  no GraphQL, no microservicios, no segundo ORM, no IA para calcular precios.
- Idioma de la interfaz: español, sin i18n.
- Moneda: GTQ, formato `Q 1,234.00`. Timezone `America/Guatemala`.
- Vendedor/responsable fijo en toda cotización y PDF: **Romeo Morales**
  (no se pide al usuario, no depende del usuario autenticado).
- El pricing SIEMPRE se calcula en un motor server-side determinístico y
  testeable (`calculateAreaPrice`, `calculateInstallationPrice`,
  `calculateQuoteTotals`, `calculateDeposit`). Nunca duplicar el cálculo en
  el frontend; nunca hardcodear precios.
- Snapshots históricos: una cotización guardada conserva los precios de ese
  momento (equipo, kit, complejidad) aunque el catálogo cambie después.
  Ver cotización = histórico, sin recalcular. Editar y guardar = nueva
  versión con precios vigentes.
- Roles: `ADMIN` (todo, incluye precios/catálogos/CompanySettings) y
  `COTIZADOR` (clientes y cotizaciones, sin tocar precios). Autorización
  verificada en backend, no solo oculta en el frontend.
- Número de cotización `COT-2026-000123` generado de forma atómica
  (secuencia en Postgres), nunca `count(*) + 1`.
- Rangos de metros: `min_meters <= meters < max_meters`, sin solapes.
- NIT es siempre string; acepta `CF` explícitamente, nunca se valida como número.
- Textos comerciales obligatorios (instalación cubre equipo+materiales+mano
  de obra) y bloque de anticipo/saldo deben aparecer siempre en el PDF,
  como se especifica en las secciones 19.5–19.6 del skill.
- PWA instalable con caché de assets/catálogos; NO offline completo para
  guardar cotizaciones — si no hay conexión, decirlo claramente.
- WhatsApp: solo botón `wa.me` con mensaje prellenado; el PDF no se adjunta
  automáticamente.

## Cómo trabajar en este repo

1. Antes de escribir código, inspecciona lo que ya existe en el repo y
   mantén lo que funcione.
2. Sigue el orden de fases de la sección 39 del skill (Fase 1 → Fase 6).
   No avances de fase sin que la fase actual pase typecheck, lint, tests
   y build.
3. Si algo en el código existente contradice una regla del skill: (a)
   señala el conflicto, (b) explica por qué, (c) propón el cambio mínimo,
   (d) no cambies la regla de negocio sin confirmación explícita.
4. Toda lógica de precios y toda generación de PDF necesitan pruebas
   (Vitest) antes de considerarse terminadas.
5. No agregues funcionalidades que no estén pedidas en el skill o en la
   tarea actual (ver sección 37, "Regla de simplicidad").

## Logo

`public/branding/climatisa-logo.png` — usar en el header del PDF y en el
layout de la app (favicon/splash de la PWA).
