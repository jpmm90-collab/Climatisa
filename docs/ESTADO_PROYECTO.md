# Estado del proyecto — Climatisa Cotizador

Última actualización: 2026-09-22 (segunda auditoría del día). Este
documento se generó/actualizó auditando el estado real **en producción**,
no de memoria ni copiando la versión anterior de este archivo: cada
afirmación se verificó en vivo (base de datos real de Railway, Vercel CLI,
navegador real contra el dominio de producción) antes de escribirse. Donde
la versión anterior de este documento decía algo distinto a lo encontrado,
se corrigió aquí en vez de dejarlo contradictorio.

**Deploy en producción: LISTO Y VERIFICADO END-TO-END, con dominio
propio.** [https://cotizador.chambeadora.com](https://cotizador.chambeadora.com)
— login, crear cliente, crear cotización con área, **generar PDF** y
**botón de WhatsApp** confirmados en vivo el 2026-09-22 con datos de
prueba creados y luego eliminados de la base real (ver sección 5, punto 6).
El dominio base **no es climatisa.com, es chambeadora.com** (dominio
propio del product owner, ya en Cloudflare) — ojo con esto, es fácil
asumir climatisa.com por el nombre del proyecto. `https://climatisa.vercel.app`
(el subdominio `.vercel.app` por defecto) sigue funcionando como respaldo.

**Corrección importante sobre la verificación anterior:** la sesión
previa (que dejó este documento en "LISTO Y VERIFICADO") solo había
probado login, lectura y escritura de un cliente — **nunca probó
generar un PDF ni el botón de WhatsApp en producción**. Esta auditoría sí
los probó, y **generar PDF estaba realmente roto en producción** (funcionaba
en local y en Vitest, pero fallaba en el runtime serverless de Vercel).
Se diagnosticó y corrigió en esta misma sesión — ver sección 5, punto 6.
Diagnóstico completo de todos los problemas de deploy encontrados hasta
ahora en el historial de commits `edbe5ba`..`37b7638`.

## 1. Resumen y decisiones fijadas

### Stack real

- Next.js 14.2.35 (App Router), TypeScript `strict: true`.
- Tailwind CSS v4 (se subió desde v3 durante la Fase 1 porque el preset
  "Nova" de shadcn/ui genera sintaxis `@theme`/`@utility` de v4) + shadcn/ui.
- PostgreSQL en **Railway**, no Neon ni Supabase. El skill original
  (sección 0) fija Neon o Supabase; esto es una **excepción confirmada por
  el product owner**, documentada en `CLAUDE.md`, y no debe revertirse.
- Prisma **6.19.3** (fijado deliberadamente, no la última versión — 7.x/8.x
  introducen una arquitectura de driver-adapters que requiere
  `prisma.config.ts` y se consideró innecesaria/inestable para este MVP).
- Auth.js / NextAuth **v4.24.15** (Credentials + **bcryptjs**, estrategia de
  sesión JWT) — deliberadamente no v5, que sigue en beta. Se usa `bcryptjs`
  (pura JS) en vez de `bcrypt` (nativo): excepción confirmada al skill,
  documentada en `CLAUDE.md`, por una falla real y recurrente de `bcrypt`
  en el runtime serverless de Vercel (`No native build was found for
  platform=linux...`) — ver sección de deuda/decisiones más abajo si
  aplica, y el historial de commits de 2026-09-22 para el diagnóstico
  completo.
- `@react-pdf/renderer` 4.9.0, generación de PDF server-side.
- Zod 4, React Hook Form 7.
- Vitest 5 para pruebas unitarias — **sí implementado** (ver sección 3 sobre
  el estado real de Playwright, que el skill también exige y **no** está
  implementado).
- Deploy: Vercel, proyecto `climatisa` (org `Climatisa`, plan **Hobby**),
  producción en https://cotizador.chambeadora.com (dominio propio, ya
  configurado — ver sección 3).

### Decisiones de producto que resuelven ambigüedades del skill

Estas cuatro decisiones se tomaron explícitamente con el product owner
durante las Fases 4–6 y están implementadas en el código, no solo
documentadas de palabra:

1. **Edición de cotizaciones — recalculo selectivo, no total.** Cada línea
   de equipo en una cotización puede traer un `sourceLineId` que apunta a
   la línea original. Si el usuario no tocó esa línea (sigue presente con
   su `sourceLineId`), se preserva el snapshot de precio exacto que ya
   tenía. Si la línea es nueva o fue modificada (sin `sourceLineId`, o con
   uno que ya no existe), se recalcula con precios vigentes del catálogo.
   Implementado en `src/app/api/quotes/[id]/route.ts` (PUT) y
   `src/lib/quote-line-resolver.ts`.
2. **CompanySettings siempre en vivo, sin snapshot por cotización.** El PDF
   de una cotización lee nombre, logo, contacto y condiciones comerciales
   de la tabla `CompanySettings` **en el momento de generarse el PDF**, no
   de un snapshot guardado con la cotización. En cambio, precios de
   equipo/kit/complejidad sí son snapshot histórico (nunca cambian aunque
   el catálogo cambie después). Implementado y comentado explícitamente en
   `src/app/api/quotes/[id]/pdf/route.ts`; verificado en vivo actualizando
   `CompanySettings` y confirmando que el PDF de una cotización ya existente
   reflejó el cambio de inmediato mientras el número de cotización y los
   precios se mantuvieron iguales.
3. **Texto base de instalación (sección 19.5) es una constante fija, no
   editable.** `INSTALLATION_BASE_TEXT` en `src/lib/constants.ts`
   ("La instalación cubre todo el equipo, materiales y mano de obra.")
   siempre aparece en el PDF, sin excepción ni edición posible desde la UI.
   El usuario solo puede agregar un texto **adicional** aparte
   (`Quote.installationNotesExtra`), nunca modificar o reemplazar el texto
   base. Ambos se renderizan como párrafos separados en
   `src/lib/pdf/quote-document.tsx`.
4. **Confirmación no bloqueante al editar cotizaciones SENT/ACCEPTED/
   REJECTED.** Editar una cotización que ya no está en `DRAFT` muestra un
   diálogo de advertencia ("Esta cotización ya fue enviada/aceptada/
   rechazada") pero **no impide** continuar — es una confirmación, no un
   bloqueo duro. Implementado en `src/components/quotes/edit-quote-button.tsx`.

Vendedor/responsable fijo (`VENDEDOR_RESPONSABLE = "Romeo Morales"`) sigue
siendo una constante en `src/lib/constants.ts`, sin exponerse como prop ni
depender de la sesión — no hay forma estructural de sobreescribirlo desde
la UI.

## 2. Qué está completo (Fases 1–6)

Todo lo listado aquí está implementado, pasa la suite de Vitest, y fue
verificado en algún momento contra la base de datos real de Railway en
sesión de navegador (no solo pruebas unitarias) — aunque, como se detalla
en la sección 3, esa verificación en vivo se hizo con scripts de Playwright
ad-hoc que nunca se comitearon al repo, no con una suite E2E mantenida.

- **Fase 1** — Next.js + Prisma + Auth.js: login con Credentials + bcryptjs,
  roles `ADMIN`/`COTIZADOR` verificados en backend (`src/lib/auth-guard.ts`,
  usado por las rutas de API sensibles), layout móvil-first, gestión de
  clientes (crear/listar/buscar), NIT como string que acepta `CF`
  explícitamente.
- **Fase 2** — Motor de precios puro y testeado (`calculateAreaPrice`,
  `calculateInstallationPrice`, `calculateQuoteTotals`, `calculateDeposit`,
  `selectInstallationKit`), administración de catálogos (equipos, kits de
  instalación por rango de metros sin solapes, complejidades).
- **Fase 3** — Asistente (wizard) de creación de cotización, mobile-first:
  selección/creación de cliente, múltiples áreas, selección de equipo por
  tarjetas grandes agrupadas por tipo, complejidad por área, extras,
  descuento, anticipo, descripción adicional, resumen final.
- **Fase 4a** — Persistencia de cotizaciones con número atómico
  `COT-2026-000123` generado vía secuencia de Postgres (`INSERT ... ON
  CONFLICT ... RETURNING`, nunca `count(*) + 1`), año calculado
  explícitamente en `America/Guatemala`. Probado bajo concurrencia real
  (5 y 10 solicitudes simultáneas, cero números duplicados).
- **Fase 4b** — Generación de PDF server-side con `@react-pdf/renderer`:
  logo, textos comerciales obligatorios (instalación cubre equipo +
  materiales + mano de obra), bloque de anticipo/saldo, vendedor fijo.
  Probado extrayendo el texto real del PDF generado, **en local y ahora
  también en producción** (ver sección 5 — se encontró y corrigió un bug
  real de empaquetado de `pdfkit` que rompía este endpoint específicamente
  en el runtime serverless de Vercel, invisible en local/Vitest).
- **Fase 5** — Búsqueda de cotizaciones (por número o nombre de cliente en
  `/cotizaciones/buscar`), edición de cotizaciones con recalculo selectivo
  (ver decisión 1 arriba), cambios de estado
  (`DRAFT → SENT → ACCEPTED/REJECTED`).
- **Botón "Compartir por WhatsApp"** (sección 43 del skill) — enlace
  `wa.me` con mensaje prellenado en la vista de cotización; el PDF nunca se
  adjunta automáticamente. Verificado con clic real hasta
  `api.whatsapp.com/send`. Ver limitación conocida en la sección 4.
- **Fase 6** — Límites de texto con error visible en vez de truncado
  silencioso (contador "N caracteres de más", bloquea el envío vía Zod);
  CRUD de datos de empresa en `/admin/empresa` (solo `ADMIN`, verificado
  que un `COTIZADOR` no puede llegar a precios/catálogos/empresa); PWA
  instalable (manifest, service worker mínimo con cache-first para
  estáticos y stale-while-revalidate solo para catálogos GET, ninguna
  solicitud no-GET se intercepta — no hay sincronización offline).
  Verificado con el motor de instalabilidad real de Chrome (no solo que el
  manifest exista) tras corregir un bug real de middleware que bloqueaba
  `/sw.js` e `/icons/*` para usuarios sin sesión.

## 3. Pendiente antes de usarlo con un cliente real

- [ ] **Reemplazar los datos demo por los datos reales de Climatisa.**
  **Sigue sin hacerse — confirmado en vivo contra Railway en esta
  auditoría** (no asumido): 5 equipos a `Q 0.00` ("Split/Cassette/Multi
  Split Demo"), 5 rangos de kit de instalación (0–25 m) a `Q 0.00`, 3
  niveles de complejidad con ajuste `Q 0.00`, y `CompanySettings` con
  `companyName="Empresa Demo"`, `phone="0000-0000"`,
  `email="demo@empresa.test"` — exactamente igual que en la auditoría
  anterior, sin cambios. Todo esto ya tiene pantallas de administración
  funcionando (`/admin/equipos`, `/admin/kits`, `/admin/complejidades`,
  `/admin/empresa`) — reemplazarlo es trabajo de datos, no de código.
- [ ] **Cambiar las contraseñas de seed.** `admin`/`admin123` y
  `cotizador`/`cotizador123` **siguen siendo las mismas en producción** —
  confirmado en esta auditoría con un login real exitoso usando
  `admin`/`admin123` contra https://cotizador.chambeadora.com. No hay
  pantalla de cambio de contraseña en la app todavía — hay que
  actualizarlas directamente en la base (o re-sembrar con valores nuevos)
  antes de dar acceso real.
- [x] **Push a GitHub al día.** `main` local y `origin/main` sincronizados
  (reconfirmado en esta auditoría, hasta el commit `37b7638` — `git log
  origin/main..HEAD` vacío).
- [x] **Deploy en Vercel.** Proyecto `climatisa` creado, variables de
  entorno de producción configuradas (`DATABASE_URL`, `NEXTAUTH_SECRET`,
  `NEXTAUTH_URL`, `NEXT_PUBLIC_COMPANY_NAME`), build y deploy en verde,
  login/lectura/escritura verificados en vivo. Ver nota importante abajo
  sobre cómo quedaron esas variables la primera vez.
- [x] **Dominio propio configurado.** `cotizador.chambeadora.com` (dominio
  de Cloudflare del product owner — **no** `climatisa.com`, ver nota de
  dominio abajo) agregado al proyecto vía `vercel domains add`, con un
  registro **CNAME** en Cloudflare en modo "DNS only" (no proxied) apuntando
  al target específico que Vercel indicó
  (`04e890770a59206e.vercel-dns-017.com.` — no el genérico
  `cname.vercel-dns.com`; cada dominio puede recibir un target distinto,
  hay que sacarlo de `vercel domains verify <dominio>` en cada caso, no
  asumirlo). `NEXTAUTH_URL` de producción actualizado a
  `https://cotizador.chambeadora.com` y redeploy hecho. Verificado con
  login real + TLS funcionando sobre el dominio final.

> **Nota — el dominio base es chambeadora.com, no climatisa.com.** El
> nombre del proyecto de Vercel (`climatisa`) y el nombre del producto
> pueden hacer pensar que el dominio también es `climatisa.com` — no lo
> es. El subdominio de producción vive bajo `chambeadora.com`, un dominio
> distinto que ya administra el product owner en Cloudflare. No asumir
> `climatisa.com` en futuras configuraciones (DNS, certificados, CORS,
> etc.) sin confirmarlo primero. **`climatisa.com` ya NO está registrado
> en la cuenta de Vercel** (se eliminó por completo en esta auditoría,
> 2026-09-22, con `vercel domains rm climatisa.com -y`) — confirmado con
> `vercel domains ls` (solo queda `chambeadora.com`) y `vercel alias ls`
> (ya no aparece `cotizador.climatisa.com`).
>
> **Nota — quitar solo el alias no basta, hay que quitar el dominio del
> proyecto.** La primera vez que se corrigió el dominio equivocado
> (sesión anterior) solo se quitó con `vercel alias rm
> cotizador.climatisa.com`, sin quitar `climatisa.com` como dominio del
> proyecto. Resultado: el siguiente `vercel --prod` **volvió a crear el
> alias automáticamente**, porque Vercel realiasa todos los dominios
> configurados en el proyecto en cada deploy de producción, sin importar
> si el alias se había borrado a mano. La forma correcta de quitar un
> dominio por completo es `vercel domains rm <dominio> -y` (nota el flag
> `-y`, no `--yes` al final ni confirmación interactiva con `echo "y" |
> ...` — el prompt de este comando específico no responde bien a stdin
> pipeado, hay que usar el flag).
>
> **Nota — `vercel domains inspect` no siempre muestra el CNAME
> recomendado.** El texto plano de `vercel domains inspect <dominio>`
> sugirió un registro **A** (`76.76.21.21`) como "[recommended]", pero el
> tipo de registro realmente verificado y aceptado por Vercel para un
> subdominio fue un **CNAME** a un target específico del dominio. Para
> obtener el registro correcto, usar `vercel domains verify <dominio>` (no
> `inspect`) y leer el campo `recommended.records` de la respuesta JSON,
> no el resumen de texto.

> **Nota importante para la próxima sesión — variables de entorno vacías.**
> Al verificar el deploy el 2026-09-22 se encontró que **las tres variables
> secretas de producción (`DATABASE_URL`, `NEXTAUTH_SECRET`,
> `NEXTAUTH_URL`) habían sido creadas en Vercel con valor vacío** (existían
> como nombre pero sin contenido) — esto rompía el build (`NEXTAUTH_URL`
> vacío hacía que `next-auth` llamara `new URL("")` durante el prerender) y
> luego el runtime (`DATABASE_URL` vacío hacía que Prisma fallara al
> conectar). Se corrigieron con valores reales vía `vercel env rm` +
> `vercel env add` (ambas cuentan como "Secret", así que sus valores no se
> pueden volver a leer por CLI/dashboard — si hace falta rotar alguna, hay
> que generarla de nuevo, no recuperarla). También se encontró y borró un
> **proyecto de Vercel duplicado** (`climatisa-bz9t`, creado por accidente
> 7 minutos después del real) — si en el futuro aparece un deploy con URL
> rara (`climatisa-xxxx-climatisa.vercel.app` en vez de simplemente
> `climatisa.vercel.app`) o variables de entorno que no coinciden con las
> que uno acaba de configurar, revisar primero si no se creó sin querer un
> segundo proyecto (`vercel project ls`).
- [ ] **Revisar el pooling de conexiones Vercel ↔ Railway antes de tráfico
  real.** En la Fase 4a se detectó agotamiento del pool de Prisma bajo
  carga concurrente (`P2028: Unable to start a transaction`) al crear
  cotizaciones. Se mitigó moviendo las lecturas (cliente, equipo,
  complejidad, kits) fuera de la transacción y fijando
  `connection_limit=20&pool_timeout=20` en `DATABASE_URL`. Ese ajuste se
  probó contra Railway directo, **no** desde funciones serverless de
  Vercel (donde cada invocación fría puede abrir su propia conexión y el
  patrón de concurrencia es distinto) — lo verificado el 2026-09-22 en
  Vercel fue correctitud de una sola request a la vez (login, lectura,
  escritura), no concurrencia. Revisar antes de tráfico real; considerar
  Prisma Accelerate o un pooler dedicado si el volumen lo justifica.
- [ ] **Suite de Playwright — pendiente, reconfirmado en esta auditoría
  (sin cambios desde la auditoría anterior).** El skill (sección 0) exige
  explícitamente "Tests E2E: Playwright" junto a Vitest. Auditando el
  repo: no existe `@playwright/test` como dependencia,
  no hay `playwright.config.ts`, y no hay ninguna carpeta de tests E2E
  comiteada. Todas las verificaciones "en navegador real" hechas en cada
  fase de este proyecto se hicieron con scripts de Playwright ad-hoc en un
  directorio temporal (`scratchpad`) fuera del repo, nunca comiteados —
  útiles para verificar en el momento, pero no quedan como regresión
  automatizada. Esto es una tarea real pendiente, no un tecnicismo: antes
  de dar el proyecto por completo hay que construir una suite mínima de
  Playwright comiteada (login, wizard de creación de cotización, edición,
  generación de PDF, botón de WhatsApp) — o decidir explícitamente con el
  product owner omitirla y documentar por qué se hace esa excepción al
  skill, siguiendo el mismo patrón que la excepción de Railway en
  `CLAUDE.md`.

## 4. Deuda técnica conocida, no bloqueante

- **Warning de refs de Radix (React 18 vs 19).** Confirmado en vivo en esta
  auditoría (consola del navegador, no solo sospecha): al abrir el diálogo
  de selección de equipo o complejidad en el wizard aparece
  `Warning: Function components cannot be given refs... Check the render
  method of 'Primitive.div.Slot'`, originado en `DialogOverlay`/
  `DialogContent` (`src/components/ui/dialog.tsx`). El preset "Nova" de
  shadcn/ui genera esos componentes como funciones planas asumiendo
  React 19 (donde `ref` es una prop normal); este proyecto usa React 18,
  que sí requiere `React.forwardRef` explícito. Ya se corrigió en `Input` y
  `Textarea` (`src/components/ui/input.tsx`, `textarea.tsx`) porque ahí
  rompía refs reales de React Hook Form; el resto de componentes Radix
  (Dialog, Select) quedó sin corregir porque el warning no bloquea
  funcionalidad — los diálogos funcionan correctamente, es solo ruido en
  la consola de desarrollo.
- **WhatsApp — número internacional de 10 dígitos sin código de país
  explícito.** `cleanPhoneForWhatsApp` (`src/lib/whatsapp.ts`) asume que un
  teléfono de exactamente 8 dígitos es local de Guatemala y le antepone
  `502`; cualquier otra longitud se asume que ya trae código de país y se
  deja tal cual. Un número de EE.UU. escrito sin el "1" inicial (ej.
  `305-555-1234`, 10 dígitos) no cae en ninguno de los dos casos limpio —
  se deja como 10 dígitos sin código de país, y el link de `wa.me`
  resultante sería inválido para ese caso puntual. Caso límite conocido, no
  resuelto, señalado explícitamente en su momento; el campo de teléfono ya
  tiene un texto de ayuda pidiendo incluir el código de país para números
  fuera de Guatemala, pero no hay validación que lo fuerce.
- No existe un script `typecheck` en `package.json` (se usa
  `npx tsc --noEmit` directamente); es una conveniencia menor, no bloquea
  nada.

## 5. Verificación de esta auditoría (2026-09-22, dos rondas el mismo día)

### Primera ronda (deploy inicial) — 2026-09-22, temprano

- Se diagnosticaron y corrigieron, en orden, tres causas reales distintas
  de un deploy roto (no un solo bug): (1) rutas autenticadas sin
  `dynamic = "force-dynamic"` explícito — `getServerSession` de next-auth
  v4 no dispara de forma confiable la detección implícita de Next para
  App Router; (2) `bcrypt` nativo sin binario compatible en el runtime
  serverless de Vercel — resuelto cambiando a `bcryptjs`; (3) las tres
  variables de entorno secretas de producción creadas vacías en Vercel.
  Cada una se diagnosticó con el log real de Vercel (`vercel logs` /
  `vercel inspect --logs`), no por prueba y error.
- Deploy de producción verificado con `vercel deploy --prod`:
  `readyState: "READY"`.
- Verificación en navegador real: login con `admin`/`admin123`,
  navegación a `/admin` y `/cotizaciones/buscar` (lectura real de
  Postgres), creación de un cliente de prueba (escritura real) confirmada
  en `/clientes` y luego eliminada de Railway. **Esta ronda NO probó
  generar PDF ni el botón de WhatsApp** — la segunda ronda (abajo) lo
  encontró y lo corrige.
- Más tarde el mismo día se configuró el dominio propio
  `cotizador.chambeadora.com` (ver sección 3).

### Segunda ronda (auditoría completa pedida explícitamente) — 2026-09-22, tarde

Auditoría punto por punto, cada uno verificado en vivo antes de escribirse
aquí:

**1) Limpieza de la verificación de producción anterior.** Se consultó la
base real de Railway (`prisma.client.count()`, `prisma.quote.count()`)
antes de tocar nada: **0 clientes, 0 cotizaciones** — la limpieza de la
ronda anterior fue completa, no quedó nada pendiente. Confirmado
explícitamente, no asumido.

**2) Dominio y variables de entorno en Vercel.** Se encontró un rastro
real del dominio equivocado que la ronda anterior no había limpiado del
todo: `climatisa.com` seguía registrado como dominio en la cuenta de
Vercel, y `cotizador.climatisa.com` había vuelto a aparecer como alias
activo (Vercel realiasa todos los dominios del proyecto en cada
`vercel --prod`, así que quitar solo el alias con `vercel alias rm` no
alcanza). Se corrigió con `vercel domains rm climatisa.com -y` — ver nota
detallada en la sección 3. Confirmado después: `vercel domains ls` solo
lista `chambeadora.com`; `vercel alias ls` ya no muestra ningún alias con
`climatisa.com`. `NEXTAUTH_URL` de producción se confirmó
indirectamente pero de forma concluyente: el login real en la sección 6
mantuvo la sesión correctamente sobre `cotizador.chambeadora.com` en
todas las páginas navegadas — si `NEXTAUTH_URL` estuviera mal, eso no
funcionaría de forma consistente (Vercel no permite leer el valor en
texto plano vía CLI/dashboard una vez guardado como "Secret").

**3) Calidad de código, en vivo.** Números reales de esta corrida:
  - `npx tsc --noEmit` → **0 errores**.
  - `npm run lint` → **0 advertencias, 0 errores** ("No ESLint warnings or errors").
  - `npx vitest run` → **10 archivos de test, 94 pruebas, 94 pasando, 0 fallando**.
  - `npm run build` → build de producción exitoso, 27 rutas compiladas
    (confirmado leyendo la tabla de rutas completa, no solo el código de
    salida).

**4) Git.** `git status --short` → vacío (sin cambios sin comitear).
`git log origin/main..HEAD` → vacío tras el commit `37b7638` (nada sin
subir). `git log HEAD..origin/main` → vacío (nada sin bajar tampoco).

**5) Estado real de cada pendiente ya documentado** — ver detalle con
cada ítem en la sección 3, resumen aquí:
  - Datos demo: **sin cambios**, siguen en `Q 0.00` / "Empresa Demo".
  - Contraseñas de seed: **sin cambios**, `admin`/`admin123` confirmado
    funcionando con un login real.
  - Plan de Vercel: **sigue en Hobby** (`vercel teams ls` → `climatisa
    Climatisa hobby`).
  - Playwright: **sigue sin implementarse**, sin cambios desde la
    auditoría anterior.

**6) Prueba funcional mínima contra producción real.** Se ejecutó el
flujo completo con datos de prueba propios, con Playwright contra
`https://cotizador.chambeadora.com`:
  - Login (`admin`/`admin123`) → OK.
  - Crear cliente ("AUDITORIA PROD `<timestamp>`") → OK.
  - Crear cotización con un área (equipo + 8m + complejidad Media) → OK,
    generó `COT-2026-000002`.
  - **Generar PDF → FALLÓ con HTTP 500.** Log real de Vercel:
    `Error: Cannot find module
    '/var/task/node_modules/pdfkit/js/standard-fonts/Helvetica.cjs'`.
    Causa raíz: `pdfkit` (usado por `@react-pdf/renderer`) carga sus
    fuentes con un `require()` dinámico que el output file tracing de
    Vercel no detecta, así que esos archivos no se incluyen en el bundle
    de la función serverless — funcionaba en local y en Vitest (Node
    directo, sin ese empaquetado) pero nunca había sido probado en el
    runtime real de Vercel hasta ahora. Corregido con
    `outputFileTracingIncludes` en `next.config.mjs` (commit `37b7638`),
    redesplegado, y **reverificado exitosamente**: HTTP 200,
    `content-type: application/pdf`, 35,456 bytes, contenido confirmado
    (nombre del cliente, "Romeo Morales", texto base de instalación).
  - Botón de WhatsApp → OK tras el fix: `href` empieza con
    `https://wa.me/`, número `50255551234` (502 antepuesto correctamente
    al número local de 8 dígitos), mensaje con formato correcto ("Hola
    AUDITORIA PROD `<timestamp>`, te compartimos la cotización
    COT-2026-000002 de Empresa Demo.").
  - **Limpieza confirmada:** se borraron el cliente y la cotización de
    prueba de Railway al terminar (`prisma.quote.delete` +
    `prisma.client.delete`), y se volvió a consultar la base para
    confirmar: **0 clientes, 0 cotizaciones** al cerrar esta auditoría.
