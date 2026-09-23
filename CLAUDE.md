# Climatisa — Cotizador de Aires Acondicionados

Este repo implementa el sistema descrito en el skill
`cotizador-aires-acondicionados` (`.claude/skills/cotizador-aires-acondicionados/SKILL.md`).
Ese archivo es la fuente principal de verdad del producto. Léelo por
completo antes de tocar código si no lo has hecho en esta sesión.

## Excepciones confirmadas al skill

El skill (sección 0) fija el proveedor de Postgres a "Supabase o Neon".
**Excepción confirmada por el product owner:** el proveedor de Postgres de
este proyecto es **Railway**, no Neon ni Supabase. Esta línea de CLAUDE.md
anula esa parte de la sección 0 del skill; el resto de la sección 0 sigue
vigente sin cambios. No revertir a Neon/Supabase ni volver a preguntar por
esto salvo que el product owner lo pida explícitamente.

El skill (sección 0) fija `bcrypt` para el hash de contraseñas.
**Excepción confirmada por el product owner:** se usa **`bcryptjs`**
(reimplementación pura en JavaScript, mismo API `hash()`/`compare()`), no
`bcrypt`. Motivo: `bcrypt` es un módulo nativo (binario `.node` compilado)
que falla en el runtime serverless de Vercel con
`No native build was found for platform=linux arch=x64...` — problema
recurrente y documentado de `bcrypt` en ese entorno, no un error puntual de
este proyecto. `bcryptjs` no tiene binario nativo, así que no depende de
que la plataforma de build coincida con la de runtime. No revertir a
`bcrypt` nativo ni volver a preguntar por esto salvo que el product owner
lo pida explícitamente.

## Extensiones confirmadas al skill

A diferencia de las excepciones de arriba (que sustituyen una regla del
skill), esto es funcionalidad nueva que **amplía** el alcance original del
skill — confirmada explícitamente por el product owner, no una corrección
de ambigüedad.

**Tipo de cotización (`quoteType`).** Toda cotización se crea para
**Climatisa** (cliente final, flujo normal) o para **Cento** (socio
comercial). Cento es un caso especial único y fijo — no un concepto
general de "socios comerciales"; no generalizar ni construir un modelo de
partners.

Reglas de Cento:
- El cliente es un registro fijo sembrado una sola vez
  (`CENTO_CLIENT_ID = "cento"` en `src/lib/constants.ts`, mismo patrón que
  `CompanySettings.id = "default"`). El asistente nunca lo busca ni lo
  crea — lo asigna automáticamente al elegir "Cento" en el primer paso, y
  el buscador normal de clientes lo excluye explícitamente.
- El equipo se sigue seleccionando del catálogo normal (para registrar qué
  se instaló) pero **no se cobra**: `equipmentPriceSnapshot` queda en
  `Q 0.00` de forma explícita, mostrado siempre con la nota "Equipo
  suministrado por el cliente" (constante `CENTO_EQUIPMENT_SUPPLIED_NOTE`)
  — nunca oculto ni omitido, en el resumen del asistente, la vista de la
  cotización guardada y el PDF.
- La instalación (kit + complejidad) sí se cobra, pero a la **tarifa de
  socio** (`InstallationKit.partnerPrice`, `Complexity.partnerAdjustment`)
  en vez de la tarifa normal. Son campos paralelos a los existentes
  (`price`, `adjustment`), nunca los reemplazan — ambas tarifas conviven
  siempre, se editan juntas en `/admin/kits` y `/admin/complejidades`.
- Dos campos de texto libre obligatorios, propios de la cotización
  (`Quote.centoVendorName`, `Quote.centoClientReference`): vendedor de
  Cento que lleva la venta, y referencia (no un registro de cliente
  completo) del cliente final de Cento.
- `quoteType` se fija al crear la cotización y **nunca cambia al editar**
  (mismo tratamiento que `quoteNumber`/`status`) — el servidor siempre usa
  el valor ya guardado, nunca el que venga en el payload de edición.
- El motor de precios puro (`calculateLineTotal` en
  `src/lib/pricing/engine.ts`) **no se modificó**. La selección de tarifa
  según `quoteType` vive en el resolver
  (`resolveLineFromCatalog` en `src/lib/quote-line-resolver.ts`, parámetro
  `quoteType` opcional, default `"CLIMATISA"`) — exactamente el mismo
  patrón que ya separaba "qué precio corresponde" (resolver) de "cómo se
  suma" (motor). Esto es deliberado: mantiene las pruebas del motor de
  precios intactas y evita que un cambio de Cento pueda romper el camino
  de Climatisa por accidente.

## No negociable (repetido aquí para que nunca se pierda de vista)

- Stack fijo: Next.js 14 (App Router) + TypeScript strict, Tailwind + shadcn/ui,
  PostgreSQL (Railway) + Prisma, Auth.js (Credentials + bcryptjs),
  `@react-pdf/renderer` server-side, Zod, React Hook Form, Vitest, Playwright.
  No Redux/Zustand, no GraphQL, no microservicios, no segundo ORM, no IA para
  calcular precios.
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
