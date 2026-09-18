---
name: cotizador-aires-acondicionados
description: Diseña, implementa y mantiene un sistema web móvil-first para gestionar cotizaciones de una empresa de instalación de aires acondicionados en Guatemala. El sistema prioriza simplicidad operativa, creación rápida de cotizaciones desde celular/tablet, precios parametrizados por equipos, kits de instalación por rangos de metros, factores de complejidad, clientes, extras, anticipos, descuentos y generación de PDF.
---

# Skill: Cotizador de Aires Acondicionados

# 0. Stack técnico obligatorio

Este proyecto debe utilizar este stack. Claude Code NO debe cambiarlo ni introducir una alternativa arquitectónica sin una razón técnica concreta y confirmación explícita.

- Framework: Next.js 14, App Router
- Lenguaje: TypeScript con `strict: true`
- Frontend + Backend: Next.js 14 Route Handlers / Server Actions
- UI: Tailwind CSS + shadcn/ui
- Base de datos: PostgreSQL
- Proveedor DB: Supabase o Neon; elegir uno al inicializar y mantenerlo fijo
- ORM: Prisma
- Autenticación: Auth.js / NextAuth con Credentials Provider + bcrypt
- PDF: `@react-pdf/renderer`, generado server-side
- PWA: sí, instalable en móvil/tablet y con caché básico de recursos y catálogos. La creación/guardado de cotizaciones requiere conexión; no implementar sincronización offline completa en MVP.
- Tests unitarios: Vitest
- Tests E2E: Playwright
- Validación: Zod
- Formularios: React Hook Form + Zod
- Moneda: GTQ / quetzales
- Formato monetario: `Q 1,234.00`
- Idioma: español únicamente; sin i18n en MVP
- Timezone: `America/Guatemala`
- Deploy: Vercel
- Control de versiones: Git
- Package manager: npm

## Reglas de stack

No introducir Redux/Zustand salvo necesidad demostrada, microservicios, GraphQL, Kubernetes, Firebase, un segundo ORM, una segunda solución de autenticación ni un segundo sistema de PDF. No utilizar IA para calcular precios. Si existe código funcional, inspeccionarlo y conservarlo cuando sea compatible. Mantener dependencias al mínimo.

## PWA

La PWA debe permitir instalación, carga rápida, caché de assets estáticos y caché de catálogos. No prometer funcionamiento offline completo. Sin conexión, informar claramente que se necesita conexión para guardar una cotización.

---

## 1. Objetivo del sistema

Construir una aplicación administrativa sencilla para una empresa que vende e instala aires acondicionados.

El sistema tiene dos módulos principales:

1. **Cotizador web móvil-first**
2. **Gestión administrativa básica de las cotizaciones/clientes**

La prioridad absoluta es que una persona pueda crear una cotización **rápidamente desde un celular o tablet mientras está en casa del cliente**, sin conocimientos técnicos ni navegación compleja.

No convertir el sistema en un ERP. No agregar funcionalidades innecesarias.

---

# 2. Principios de producto

## Regla principal

> La persona que cotiza debe pensar en el trabajo que está viendo, no en cómo funciona el sistema.

La aplicación debe ocultar toda la complejidad de cálculo.

El usuario solamente debe seleccionar/ingresar:

- Cliente
- Área
- Equipo
- Metros de instalación
- Complejidad
- Extras
- Anticipo
- Descuento
- Descripción adicional

El sistema calcula automáticamente los precios.

## UX

Diseñar para usuarios con bajo nivel académico y poca experiencia tecnológica.

Preferir:

- botones grandes
- textos claros
- pocas opciones por pantalla
- una sola decisión principal por pantalla
- lenguaje cotidiano
- números grandes
- formularios cortos
- navegación "Siguiente / Atrás"
- valores predeterminados inteligentes
- confirmaciones visuales
- evitar tablas complejas durante la creación
- evitar menús desplegables largos cuando pueda utilizarse selección mediante tarjetas/botones

No utilizar lenguaje técnico como "SKU", "pricing engine", "factor multiplicador", "entidad", etc. en la interfaz del usuario.

---

# 3. Módulos

## Módulo A — Cotizador

Debe permitir:

- iniciar sesión
- crear cliente
- buscar cliente
- crear cotización
- buscar cotización
- editar cotización
- visualizar cotización
- generar PDF
- descargar PDF

## Módulo B — Administración básica

Debe permitir gestionar:

- clientes
- equipos
- precios de equipos
- kits de instalación
- factores de complejidad
- cotizaciones

La administración de precios NO debe estar mezclada con la experiencia del cotizador.

---

# 4. Flujo principal

El flujo recomendado es:

### Pantalla 1 — Login

Muy simple:

- Usuario
- Contraseña
- Entrar

No agregar funcionalidades adicionales salvo que sean necesarias.

---

### Pantalla 2 — Inicio

Mostrar únicamente las acciones principales:

**Crear cotización**

**Buscar cotización**

**Crear cliente**

Opcionalmente mostrar debajo:

- última cotización
- cotizaciones recientes

Pero no saturar la pantalla.

---

# 5. Crear cliente

Campos:

### Obligatorios

- Nombre
- Teléfono
- Empresa
- NIT

### Dirección

- Dirección

Regla:

**NIT puede ser "CF".**

No validar "CF" como número. Debe aceptarse explícitamente como valor válido.

Después de guardar:

- mostrar confirmación
- regresar automáticamente al flujo desde el que se creó el cliente

Ejemplo:

Crear cotización → "Crear cliente" → guardar → regresar automáticamente a "Crear cotización" con el cliente ya seleccionado.

Nunca obligar al usuario a volver a buscar al cliente manualmente.

---

# 6. Buscar cotización

Mostrar lista de cotizaciones existentes.

Cada elemento debe mostrar como mínimo:

- número de cotización
- cliente
- fecha
- total
- estado, si existe

Filtros mínimos:

- número de cotización
- nombre del cliente

La búsqueda debe funcionar rápidamente desde celular.

No crear filtros innecesarios en la primera versión.

---

# 7. Crear cotización

## Paso 1 — Seleccionar cliente

Primero:

**Buscar cliente**

y debajo:

**+ Crear cliente**

Si el cliente existe:

- seleccionarlo
- continuar

Si no existe:

- crear cliente
- regresar automáticamente
- continuar con el cliente seleccionado

---

# 8. Número de áreas

Preguntar:

**¿Cuántas áreas vamos a cotizar?**

Ejemplo:

[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]

También permitir ingresar un número manual si es necesario.

Después pasar a las áreas una por una.

---

# 9. Área

Cada área debe ser una pantalla independiente.

Ejemplo:

## Área 1

### Nombre del área

Ejemplos:

- Habitación principal
- Sala
- Comedor
- Oficina
- Dormitorio 2

Campo de texto.

### Equipo

Seleccionar de una lista parametrizada.

Ejemplo visible:

**Cassette Multi Split LG — 12,000 BTU**

El usuario NO debe escribir el precio.

El sistema conoce el precio del equipo.

Puede haber uno o varios equipos por área si el negocio lo necesita.

---

# 10. Metros de instalación

La lógica de precios de instalación debe ocultarse al usuario.

Los kits se definen por rangos de distancia.

Ejemplo conceptual:

- Menos de 5 m
- 5–10 m
- 10–15 m
- 15–20 m
- 20–25 m
- etc.

La configuración exacta de los rangos debe vivir en la base de datos/configuración, NO estar codificada directamente en la interfaz.

El usuario solamente ingresa:

**¿Cuántos metros?**

Ejemplo:

`8`

El sistema determina automáticamente el kit correspondiente:

`5–10 m`

---

# 11. Complejidad de instalación

Utilizar tres niveles:

### Complejidad 1
Instalación sencilla.

### Complejidad 2
Instalación con cierta dificultad.

### Complejidad 3
Instalación compleja.

La interfaz debe mostrar una explicación sencilla debajo de cada opción.

Ejemplo:

**1 — Sencilla**
Instalación normal, sin trabajos especiales.

**2 — Media**
Requiere trabajos adicionales.

**3 — Compleja**
Requiere bastante trabajo adicional.

Los detalles exactos del incremento de precio deben ser configurables.

No mostrar al usuario el cálculo interno.

---

# 12. Cómo se calcula el precio

Conceptualmente:

`Precio del equipo + precio del kit de instalación según metros + ajuste por complejidad`

El sistema debe mantener separados los componentes internamente.

Por ejemplo:

```text
Equipo
Cassette Multi Split LG 12,000 BTU
Precio equipo: Q X

Instalación
Kit 5–10 m: Q Y
Complejidad: 2
Ajuste complejidad: Q Z

Subtotal área: Q TOTAL
```

Pero en la cotización para el cliente se puede presentar de forma mucho más simple:

| Descripción | Precio |
|---|---:|
| Cassette Multi Split LG 12,000 BTU | Q X |
| Instalación | Q Y |
| Total área | Q Z |

La instalación presentada al cliente debe incluir internamente el kit + complejidad.

No mostrar fórmulas internas, multiplicadores o parámetros técnicos salvo que se decida expresamente.

---

# 13. Terminología de complejidad

La complejidad puede estar basada principalmente en factores como:

- tablayeso
- pintura
- canaletas
- recorridos difíciles
- perforaciones
- acceso complicado
- trabajos adicionales

Pero estos factores deben alimentar el cálculo interno.

En la primera versión, el usuario puede seleccionar simplemente:

**Complejidad 1 / 2 / 3**

Si posteriormente se necesita mayor precisión, puede evolucionarse a factores específicos.

No complicar el MVP.

---

# 14. Repetición de áreas

Después de completar un área:

Mostrar:

**Área 1 lista ✓**

y automáticamente:

**Área 2**

Repetir hasta completar el número de áreas indicado.

El usuario debe saber claramente:

`Área 2 de 4`

Esto reduce errores.

---

# 15. Extras

Después de completar las áreas:

Pantalla:

## ¿Hay algún trabajo adicional?

Campos:

- Descripción
- Precio

Permitir múltiples extras.

Ejemplo:

`Pintura adicional — Q350`

`Canaleta especial — Q500`

Botón:

**+ Agregar otro**

Si no hay extras:

**No hay extras**

No obligar al usuario a agregar uno.

---

# 16. Anticipo

Pantalla:

## ¿Cuánto anticipo se solicitará?

Ingresar porcentaje.

Ejemplo:

`50%`

El sistema calcula automáticamente:

- total
- anticipo
- saldo

Debe poder configurarse un valor predeterminado si el negocio normalmente utiliza un porcentaje determinado.

---

# 17. Descuento

Pantalla:

## ¿Hay descuento?

Permitir ingresar descuento.

Definir claramente si el sistema trabaja con:

- porcentaje
- monto

Preferentemente permitir ambos internamente, pero mantener la interfaz extremadamente simple.

Mostrar inmediatamente:

**Total antes del descuento**

**Descuento**

**Total final**

Nunca permitir que un descuento genere accidentalmente un total negativo.

---

# 18. Descripción adicional

Campo:

## ¿Quieres agregar algo a la cotización?

Texto libre.

Ejemplos:

- Tiempo estimado de instalación
- Condiciones especiales
- Observaciones
- Forma de pago
- Garantía
- Trabajos no incluidos

Es opcional.

---

# 19. Resumen antes de generar

Antes de crear el PDF mostrar una pantalla de revisión.

Debe ser extremadamente fácil de leer.

Ejemplo:

```text
COTIZACIÓN #000123

Cliente
Juan Pérez
Tel. 5555-5555
NIT: CF

ÁREAS

Habitación principal
Cassette Multi Split LG 12,000 BTU
Instalación
Q 8,500

Sala
Split LG 18,000 BTU
Instalación
Q 7,200

Extras
Canaleta especial
Q 500

TOTAL
Q 16,200

Anticipo 50%
Q 8,100

Saldo
Q 8,100
```

Botones:

**Editar**

**Generar cotización**

---

# 19.5. Texto comercial obligatorio de instalación

Debajo de los costos de instalación de la cotización debe aparecer siempre una descripción comercial clara indicando que la instalación incluye:

> **La instalación cubre todo el equipo, materiales y mano de obra.**

Este texto forma parte del contenido estándar de la cotización y debe aparecer automáticamente en el PDF.

El texto debe ser editable **antes de generar el PDF**, para que el usuario pueda agregar aclaraciones específicas de la instalación sin modificar el texto base obligatorio.

Regla recomendada:

- Texto base obligatorio: siempre presente.
- Texto adicional: opcional y editable por el usuario.
- El usuario puede agregar información antes de generar el PDF.
- No permitir que el texto base obligatorio desaparezca accidentalmente.

Ejemplo visual:

```text
Instalación
Q 3,500.00

La instalación cubre todo el equipo, materiales y mano de obra.

[Agregar información adicional...]
```

# 19.6. Anticipo dentro de la sección comercial

La información del anticipo debe aparecer inmediatamente después de la información de costos/instalación en la cotización.

Mostrar como mínimo:

- porcentaje de anticipo
- monto del anticipo
- saldo pendiente

Ejemplo:

```text
Anticipo: 50% — Q 8,100.00
Saldo: Q 8,100.00
```

El porcentaje se toma inicialmente de `CompanySettings.default_deposit_percentage`, pero el usuario puede modificarlo durante la creación de la cotización antes de generar el PDF.

El usuario también debe poder modificar cualquier texto adicional relacionado con esta sección antes de generar el PDF, siempre conservando los valores calculados correctos del anticipo y saldo.

# 20. PDF

Al confirmar, generar automáticamente un PDF profesional.

El PDF debe tener diseño limpio, moderno y empresarial.

Debe incluir:

- logo de la empresa
- nombre de la empresa
- datos de contacto de la empresa
- número de cotización
- fecha
- vendedor/responsable: **Romeo Morales**
- datos del cliente
- nombre
- teléfono
- dirección
- empresa
- NIT
- áreas
- equipos
- instalación
- extras
- subtotal
- descuento
- total
- anticipo
- saldo
- descripción adicional
- condiciones comerciales si están configuradas

El PDF debe estar preparado para:

- descargar
- descargar el PDF
- guardar

No crear un PDF excesivamente cargado.

---

# 21. Vista para el cliente

El cliente debe ver algo comercial, no técnico.

NO mostrar:

- ID interno de equipo
- ID de kit
- factor 1/2/3
- fórmula de cálculo
- multiplicadores
- reglas internas de pricing
- margen
- costo interno

Mostrar únicamente la información necesaria para entender qué está comprando.

---

# 22. Modelo de datos conceptual

Entidades mínimas:

## User

- id
- name
- email/username
- password_hash
- role
- created_at

## Client

- id
- name
- phone
- address
- company
- nit
- created_at
- updated_at

## Equipment

- id
- name
- brand
- model
- btu
- type
- price
- active
- created_at
- updated_at

## InstallationKit

- id
- min_meters
- max_meters
- price
- active

Ejemplo:

```text
<5 m       Q...
5–10 m     Q...
10–15 m    Q...
15–20 m    Q...
```

## Complexity

- id
- level
- name
- description
- adjustment
- active

Ejemplo:

```text
1
Sencilla
Q0

2
Media
Q...

3
Compleja
Q...
```

## Quote

- id
- quote_number
- client_id
- date
- subtotal
- discount_type
- discount_value
- discount_amount
- total
- deposit_percentage
- deposit_amount
- balance
- additional_description
- status
- created_at
- updated_at

## QuoteArea

- id
- quote_id
- name
- meters
- installation_kit_id
- complexity_id
- installation_price
- area_total

## QuoteAreaEquipment

- id
- quote_area_id
- equipment_id
- equipment_name_snapshot
- equipment_price_snapshot
- quantity

Guardar snapshots de nombre/precio en la cotización para que una cotización histórica NO cambie si posteriormente cambia el precio del equipo.

## QuoteExtra

- id
- quote_id
- description
- price

---

# 23. Reglas críticas del pricing

Los precios son configurables.

Nunca asumir precios reales.

Nunca hardcodear precios dentro del frontend.

La lógica debe permitir modificar:

- precio de cada equipo
- rangos de metros
- precio de cada kit
- ajuste de complejidad
- equipos activos/inactivos

El usuario administrativo debe poder cambiar estos valores sin modificar código, si el módulo de administración ya está implementado.

---

# 24. Regla para históricos

Una cotización generada debe conservar los precios originales.

Si hoy:

`LG 12,000 BTU = Q8,000`

y mañana cambia a:

`LG 12,000 BTU = Q8,500`

una cotización creada hoy debe seguir mostrando:

`Q8,000`

Lo mismo aplica para:

- kits
- complejidad
- extras

Por eso deben almacenarse snapshots en la cotización.

---

# 25. UX móvil

La aplicación debe diseñarse primero para:

- teléfono
- tablet

y después escritorio.

Objetivo operativo:

Una cotización normal debe poder completarse con pocos toques y escritura mínima.

Usar:

- inputs grandes
- botones de mínimo aproximadamente 44px de altura
- teclado numérico para metros, porcentajes y precios
- autofocus donde tenga sentido
- evitar scroll horizontal
- barra de progreso simple
- botón Siguiente siempre accesible
- botón Atrás siempre disponible
- conservar información si el usuario retrocede

---

# 26. Prevención de errores

El sistema debe evitar errores comunes.

Ejemplos:

- no permitir avanzar sin cliente
- no permitir avanzar sin área
- no permitir avanzar sin equipo
- metros deben ser >= 0
- descuento no puede superar el subtotal
- anticipo debe estar entre 0 y 100%
- precios no pueden ser negativos
- NIT debe aceptar `CF`
- teléfono debe tener validación razonable pero no excesivamente restrictiva
- una cotización guardada no debe perderse si el usuario navega accidentalmente hacia atrás

---

# 27. Número de cotización

Generar automáticamente un número único y legible.

Ejemplo:

`COT-2026-000123`

Nunca depender de que el usuario escriba el número.

---

# 28. Estados

Mantener inicialmente pocos estados:

- Borrador
- Enviada
- Aceptada
- Rechazada

No crear un workflow complejo en el MVP.

---

# 29. Arquitectura

Priorizar una arquitectura sencilla.

No introducir:

- microservicios
- Kubernetes
- event-driven architecture
- CQRS
- GraphQL
- ORM complejo
- sistemas de IA innecesarios

Para este sistema:

**CRUD + pricing determinístico + generación de PDF** es suficiente.

La lógica de precios debe ser determinística y testeable.

---

# 30. API conceptual

Endpoints mínimos:

```text
POST   /auth/login

GET    /clients
POST   /clients
GET    /clients/:id
PUT    /clients/:id

GET    /quotes
POST   /quotes
GET    /quotes/:id
PUT    /quotes/:id

GET    /equipment
POST   /equipment
PUT    /equipment/:id

GET    /installation-kits
POST   /installation-kits
PUT    /installation-kits/:id

GET    /complexities
POST   /complexities
PUT    /complexities/:id

POST   /quotes/:id/pdf
```

Adaptar los endpoints a la arquitectura real del proyecto si ya existe una.

---

# 31. Motor de precios

Implementar el cálculo en una función/servicio aislado.

Conceptualmente:

```text
calculateAreaPrice(area)
calculateInstallationPrice(meters, complexity)
calculateQuoteTotals(areas, extras, discount)
calculateDeposit(total, percentage)
```

Debe ser fácil de probar con unit tests.

Ejemplo conceptual:

```text
equipmentTotal =
  suma(precio_equipo * cantidad)

installationBase =
  precio_kit_correspondiente_a_metros

complexityAdjustment =
  ajuste_de_complejidad

installationTotal =
  installationBase + complexityAdjustment

areaTotal =
  equipmentTotal + installationTotal
```

Si posteriormente el negocio cambia la fórmula, modificar el motor de pricing, no el frontend.

---

# 32. Selección del kit

Regla:

Dado un número de metros, encontrar el primer rango que lo contiene.

Definir claramente los límites para evitar ambigüedad.

Ejemplo:

```text
0–4.99
5–10
10.01–15
...
```

O, preferentemente, definir rangos mediante límites matemáticos consistentes en base de datos.

No permitir que existan rangos superpuestos.

Validar que tampoco existan huecos si el negocio requiere cobertura continua.

---

# 33. Administración de precios

La pantalla administrativa de equipos debe mostrar:

- nombre
- marca
- modelo
- BTU
- tipo
- precio
- activo

La pantalla de kits:

- desde metros
- hasta metros
- precio
- activo

La pantalla de complejidad:

- nivel
- nombre
- descripción
- ajuste
- activo

Estas pantallas pueden ser más técnicas porque están destinadas al administrador.

---

# 34. Diseño visual

Dirección visual:

**Simple + profesional + confiable + práctico**

No diseñar como software corporativo pesado.

Debe sentirse más parecido a una aplicación móvil que a un ERP.

Recomendaciones:

- fondo claro
- tarjetas
- tipografía grande
- alto contraste
- pocos colores
- botones primarios claramente identificables
- iconos simples
- espacios amplios

El usuario debe saber qué hacer sin leer instrucciones largas.

---

# 35. Microcopy

Usar lenguaje natural.

Preferir:

**Crear cotización**

en lugar de:

**Nueva transacción comercial**

Preferir:

**¿Cuántas áreas vamos a instalar?**

en lugar de:

**Número de unidades de servicio**

Preferir:

**¿Cuántos metros de instalación?**

en lugar de:

**Longitud de recorrido de instalación**

Preferir:

**¿Hay algún trabajo adicional?**

en lugar de:

**Agregar conceptos extraordinarios**

---

# 36. Comportamiento de navegación

El flujo debe sentirse como un asistente:

```text
Cliente
   ↓
Número de áreas
   ↓
Área 1
   ↓
Área 2
   ↓
Área 3
   ↓
Extras
   ↓
Anticipo / descuento
   ↓
Descripción adicional
   ↓
Revisar
   ↓
Generar PDF
```

Evitar una página gigante con 30 campos.

---

# 37. Regla de simplicidad

Si una funcionalidad no ayuda directamente a:

- cotizar
- encontrar una cotización
- administrar clientes
- administrar precios
- generar la cotización

probablemente no pertenece al MVP.

Antes de agregar una funcionalidad, preguntar:

> ¿Esto hace que cotizar sea más rápido, más correcto o más fácil?

Si la respuesta es no, no agregarla.

---

# 38. Responsabilidad de Claude al implementar

Cuando trabajes en este proyecto:

1. Inspecciona primero el código existente.
2. No reemplaces arquitectura funcional sin necesidad.
3. Identifica las tecnologías ya utilizadas.
4. Mantén consistencia con el proyecto.
5. Implementa primero el flujo completo de cotización.
6. Después agrega administración.
7. Prioriza funcionalidad sobre ornamentación.
8. No inventes precios.
9. No inventes datos comerciales.
10. No agregues IA para resolver problemas que pueden resolverse con reglas determinísticas.
11. Toda lógica de precios debe tener tests.
12. Toda generación de PDF debe tener pruebas básicas de contenido.
13. Mantén el código sencillo y mantenible.

---

# 39. Orden recomendado de implementación

## Fase 1

- autenticación
- layout móvil
- dashboard
- clientes

## Fase 2

- equipos
- kits
- complejidades
- pricing engine

## Fase 3

- creación de cotización
- múltiples áreas
- extras
- descuentos
- anticipo

## Fase 4

- resumen
- persistencia
- número de cotización
- generación PDF

## Fase 5

- búsqueda de cotizaciones
- edición
- estados

## Fase 6

- mejoras UX
- validaciones
- administración de parámetros
- pruebas
- optimización móvil

---

# 40. Criterio de éxito

El sistema está bien construido cuando una persona que nunca lo ha utilizado puede:

1. iniciar sesión
2. buscar o crear un cliente
3. indicar cuántas áreas tiene
4. completar cada área
5. elegir equipo
6. indicar metros
7. elegir complejidad
8. agregar extras si existen
9. indicar anticipo
10. indicar descuento
11. agregar observaciones
12. revisar
13. generar PDF

sin necesitar explicación técnica.

El objetivo no es que el sistema tenga muchas funciones.

El objetivo es que **cotizar una instalación de aire acondicionado sea casi tan sencillo como llenar un formulario de WhatsApp**, pero produciendo una cotización profesional, consistente y con precios calculados automáticamente.


# 43. Reglas operativas definitivas

Esta sección resuelve las ambigüedades de implementación. Claude Code debe tratarlas como reglas de producto.

## WhatsApp

En MVP NO se implementará envío automático del PDF mediante WhatsApp Business API.

Al terminar la cotización:
1. Se genera el PDF.
2. El usuario puede descargarlo.
3. Hay un botón **Compartir por WhatsApp**.
4. El botón abre WhatsApp mediante `wa.me` con un mensaje prellenado.
5. El PDF NO se adjunta automáticamente; el usuario lo adjunta desde el dispositivo.

Mensaje sugerido: `Hola [nombre], te compartimos la cotización [COT-2026-000123] de [empresa].`

## CompanySettings

## Vendedor / responsable fijo de la cotización

El nombre que siempre aparecerá como vendedor o dueño de la empresa en la cotización es:

**Romeo Morales**

Este nombre no debe pedirse al usuario al crear una cotización ni depender de cuál usuario haya iniciado sesión. Debe aparecer automáticamente en el PDF y en cualquier sección de la cotización destinada a identificar al vendedor/responsable.

No permitir cambiar este nombre desde el flujo normal de creación de cotizaciones. Si en el futuro se necesita modificarlo, deberá hacerse mediante una configuración administrativa explícita.

Agregar una entidad única de configuración de empresa:

```text
CompanySettings
- id
- company_name
- logo_url
- phone
- email
- address
- commercial_terms
- default_deposit_percentage
- created_at
- updated_at
```

El logo se gestiona mediante URL en MVP, no mediante subida de archivos. Estos datos alimentan el PDF, encabezado, contacto, condiciones y anticipo predeterminado.

## Roles

Solo dos roles en MVP:

**ADMIN:** puede gestionar clientes, cotizaciones, equipos, kits, complejidades, CompanySettings, usuarios si existe esa función y precios.

**COTIZADOR:** puede crear/editar clientes, crear/editar/ver cotizaciones y generar PDFs; NO puede modificar precios, kits, complejidades, CompanySettings ni usuarios.

La autorización se verifica en backend, no solo ocultando botones en frontend.

## Edición de cotizaciones

**Ver** una cotización muestra exactamente sus snapshots históricos y NO recalcula.

**Editar** carga la cotización existente. Al guardar, se recalcula con los precios vigentes en ese momento y se reemplazan los snapshots de los elementos modificados. La cotización guardada pasa a ser la versión vigente.

Regla: **ver = histórico; editar y guardar = nueva versión calculada con precios actuales.**

## Rangos de metros

Usar intervalos `min_meters <= meters < max_meters`.

Ejemplo:
```text
0 <= m < 5
5 <= m < 10
10 <= m < 15
15 <= m < 20
```

`max_meters` puede ser NULL para el último rango sin límite. No permitir rangos superpuestos ni duplicados; evitar huecos cuando la configuración requiera cobertura continua.

## NIT

`nit` es siempre `string`. Aceptar NIT numérico y `CF`. No convertirlo a número ni eliminar automáticamente guiones.

## Múltiples equipos por área

Una misma área puede tener varios equipos. El usuario dispone de **+ Agregar otro equipo**.

Cada línea de equipo tiene individualmente:
- equipo
- cantidad (por defecto 1)
- metros
- kit
- complejidad

El kit y la complejidad son **por unidad de equipo instalado**.

Si dos equipos tienen recorridos/complejidades diferentes, se agregan como líneas independientes. Si son equivalentes, pueden usar `quantity > 1` con los mismos metros y complejidad.

## Pricing engine definitivo

La jerarquía es:

```text
Quote
  └── Area[]
        └── AreaEquipment[]
```

El kit es por equipo instalado y la complejidad es por equipo instalado.

Para cada línea:

```text
equipment_total = equipment_price * quantity
installation_unit_price = kit_price + complexity_adjustment
installation_total = installation_unit_price * quantity
line_total = equipment_total + installation_total
```

Luego:

```text
area_total = suma(line_total)
quote_subtotal = suma(area_total) + suma(extras)
discount_amount = descuento calculado
quote_total = quote_subtotal - discount_amount
deposit_amount = quote_total * deposit_percentage / 100
balance = quote_total - deposit_amount
```

`QuoteAreaEquipment` debe contener:

```text
id
quote_area_id
equipment_id
quantity
meters
installation_kit_id
complexity_id
equipment_name_snapshot
equipment_price_snapshot
installation_kit_price_snapshot
complexity_adjustment_snapshot
installation_price_snapshot
line_total
```

## Estados

Estados: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`.

- DRAFT: se crea automáticamente mientras se prepara.
- SENT: el cotizador lo marca manualmente cuando fue entregada/enviada.
- ACCEPTED: se marca manualmente cuando el cliente acepta.
- REJECTED: se marca manualmente cuando el cliente rechaza.

Generar el PDF NO cambia automáticamente el estado.

## Número de cotización

Formato único: `COT-2026-000123`.

Generarlo de forma atómica en PostgreSQL mediante secuencia o mecanismo transaccional equivalente. Nunca usar `count(*) + 1`. El año corresponde al año de creación en `America/Guatemala`.

## Teléfonos

Para Guatemala aceptar normalmente 8 dígitos y formatos como `55555555` y `5555-5555`. No ser excesivamente restrictivo y permitir números internacionales válidos si el negocio los necesita.

## Límites de texto

- Cliente: 120
- Empresa: 120
- Dirección: 300
- Área: 60
- Extra: 200
- Descripción adicional: 500
- Condiciones comerciales: 2000

No truncar silenciosamente.

## Adjuntos

No habrá fotos, documentos ni otros adjuntos en el MVP. El logo se maneja mediante URL.

## Seed data

El proyecto debe arrancar con datos de demostración para poder probarlo inmediatamente, sin inventar precios reales:

- 3–5 equipos demo a `Q 0.00`
- kits `0–<5`, `5–<10`, `10–<15`, `15–<20`, `20–<25`, todos `Q 0.00`
- complejidades 1/2/3, todas `Q 0.00`
- CompanySettings con `Empresa Demo`

Los datos deben estar claramente marcados como demo y ser editables por ADMIN.

## PWA y conectividad

La PWA es instalable y cachea interfaz/assets/catálogos cuando sea posible. MVP NO implementa edición offline ni sincronización de cotizaciones offline. Si no hay conexión al guardar, informar claramente y no aparentar que se guardó.

## Regla para Claude Code

Los valores de stack, roles, estados, WhatsApp, rangos, pricing, snapshots, CompanySettings, PWA y seed son decisiones de producto. Claude Code no debe reinterpretarlos silenciosamente.

Si encuentra conflicto entre código existente y esta especificación:
1. identificarlo;
2. explicar el conflicto;
3. proponer la modificación mínima;
4. no cambiar la regla de negocio sin confirmación.
