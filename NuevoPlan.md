# Nuevo Plan de Desarrollo — Monotickets Platinum (SRS v1.1)

Este plan traduce el documento `SRS_Monotickets_Platinum_v1.1.md` a una lista de módulos/entregables con *prompts listos* para ir implementando (backend + frontend + QA) de forma incremental.

**Repos en este workspace**
- Backend: `monotickets-api` (NestJS + Prisma + PostgreSQL)
- Frontend: `monotickets-platinum` (Angular)

**Reglas transversales (SRS)**
- Idioma: es-MX, timezone única: CDMX.
- Límites: máx. 5 eventos simultáneos; 1000 invitados por evento; 1000 invitaciones por evento; `guestCount` 1–10.
- Flujo principal: ≤ 4 acciones por historia (diseñar UI y endpoints para minimizar pasos).
- QR: válido sólo 00:00–23:59 del día del evento (CDMX), firmado (JWT) y validado en cada escaneo.
- Delivery: siempre doble canal (SMS + WhatsApp), hasta 3 reintentos automáticos por canal; reenvío manual; manejo de número inválido.
- Cierre automático: 72 horas después de la hora del evento (CDMX).
- RSVP: revocable por invitado hasta 20 días desde recepción de invitación; planner puede confirmar manualmente.
- Alertas: si >10% envíos fallan por evento, alerta visible al Director Global.
- Legal: anonimizar datos personales a 12 meses; conservar métricas agregadas; borrado manual bajo solicitud.

---

## 0) Base técnica: contratos, convenciones y “definition of done”

**Objetivo**
Dejar un marco consistente para que cada módulo salga con: esquema de datos, endpoints, validaciones, UI mínima mobile-first y pruebas.

**Entregables**
- Documento `API_CONTRACT.md` (opcional) con endpoints y errores comunes.
- Checklist de pruebas y observabilidad (logs/auditoría) por módulo.

**Prompt (arquitectura / criterios comunes)**
> En este repo existen `monotickets-api` (NestJS + Prisma) y `monotickets-platinum` (Angular). Define un estándar transversal para los módulos del MVP: convenciones de errores (códigos y mensajes), validación (DTO + class-validator), autorización por rol (DIRECTOR_GLOBAL/PLANNER/STAFF), timezone CDMX para fechas, y una “definition of done” que incluya: migración Prisma si aplica, endpoints documentados, pruebas unitarias mínimas y pruebas e2e básicas del flujo. Entrega una lista concreta de decisiones y plantillas (snippets) para: error response, pagination, filtering, y auditoría de acciones críticas (publish, send, scan, rsvp).

---

## 1) Módulo de Identidad y Roles (Planner / Staff / Director Global)

**Requerimientos (SRS)**
- Control de acceso por rol (seguridad).
- Paneles diferenciados (Planner / Director / Scanner).

**Huecos típicos vs SRS**
- Asegurar RBAC en cada endpoint crítico (publicar evento, envío, métricas globales, escaneo).

**Prompt (backend: RBAC completo + claims)**
> En `monotickets-api`, revisa y endurece la autenticación/autorización existente para cumplir RBAC estricto por rol: DIRECTOR_GLOBAL, PLANNER, STAFF. Implementa decoradores/guards para: (1) permitir que PLANNER opere sólo sobre sus eventos, (2) STAFF sólo pueda usar endpoints de escaneo del evento asignado (define cómo se asigna, aunque sea por “eventId permitido” en token), (3) DIRECTOR_GLOBAL pueda ver métricas globales y alertas. Asegura que los endpoints públicos (landing/RSVP/QR token render) no expongan datos sensibles. Incluye pruebas unitarias para guards y 2 pruebas e2e de autorización.

**Prompt (frontend: guardas de rutas)**
> En `monotickets-platinum`, implementa guards de rutas y layout por rol para: Planner Dashboard, Director Dashboard y Staff Scanner. Asegura redirección consistente si el rol no corresponde y manejo de token expirado. Mobile-first.

---

## 2) Módulo de Eventos (CRUD + estados + cierre automático)

**Requerimientos (SRS)**
- Estados: `DRAFT → PUBLISHED → CLOSED → BLOCKED`
- Publicación sólo Planner.
- Cierre automático: 72h tras fecha/hora del evento (CDMX).
- Restricción: máx. 5 eventos simultáneos (interpretación sugerida: “PUBLISHED y no CLOSED”).

**Prompt (datos + backend: estados, publish, autoclose)**
> En `monotickets-api` crea/ajusta el modelo de datos para soportar el estado del evento: enum EventStatus {DRAFT,PUBLISHED,CLOSED,BLOCKED}, timestamps de publishedAt/closedAt, y blockedReason opcional. Actualiza `events` para: crear evento en DRAFT, publicar (cambia a PUBLISHED) sólo si cumple validaciones, bloquear/desbloquear (sólo DIRECTOR_GLOBAL) y cerrar. Implementa un job (Nest Schedule o similar) que marque CLOSED automáticamente 72h después de la fecha/hora del evento en CDMX. Enforce “máx. 5 eventos simultáneos” por planner (PUBLISHED y no cerrados) devolviendo error claro. Agrega pruebas unitarias del service y una prueba e2e del autocierre (mock de tiempo).

**Prompt (frontend: flujo ≤4 acciones)**
> En `monotickets-platinum`, implementa el flujo Planner para “Crear evento” y “Publicar” en ≤4 acciones: formulario minimalista (nombre, fecha/hora, ubicación opcional) + confirmación. Muestra estado (DRAFT/PUBLISHED/CLOSED/BLOCKED) y advertencias (ej. bloqueo, límite de 5). Incluye un listado de eventos con filtros por estado.

---

## 3) Módulo de Plantillas (PDF y Premium Landing)

**Requerimientos (SRS)**
- Plantillas PDF y Premium (landing).
- Performance landing: carga ≤ 3s en 4G; peso ≤ 3MB.
- Invitado: experiencia mobile-first.

**Prompt (backend: catálogo de plantillas + render/preview)**
> En `monotickets-api`, implementa un catálogo de plantillas para evento: tipo PDF y tipo PREMIUM_LANDING. Define endpoints para listar plantillas disponibles, asignar plantilla a un evento, y obtener datos necesarios para render (sin exponer datos sensibles). Considera versionado simple de plantillas. Incluye validaciones para que sólo PLANNER (dueño) pueda asignar y ver preview.

**Prompt (frontend: landing premium optimizada)**
> En `monotickets-platinum`, implementa la “Landing Invitado” para plantilla Premium: página mobile-first que consume un endpoint público por invitación y muestra información del evento e invitado. Optimiza para ≤3MB (imágenes responsive, lazy loading) y carga rápida (evitar librerías pesadas). Define una estrategia de medición (Lighthouse/Angular budget) y deja budgets configurados si aplica.

---

## 4) Módulo de Invitados (CRUD + import CSV + Host Link)

**Requerimientos (SRS)**
- Gestión de invitados: CSV, RSVP, Host Link.
- Límites: 1000 invitados por evento; `guestCount` 1–10.

**Prompt (backend: import CSV con validación y dedupe)**
> En `monotickets-api`, extiende `guests` para soportar importación CSV para un evento (PLANNER dueño). Implementa endpoint `POST /events/:eventId/guests/import` que acepte CSV (multipart) con columnas: fullName, phone/email, guestCount. Reglas: guestCount 1–10, máximo 1000 invitados por evento, deduplicación (por phone o email) configurable. Devuelve un resumen: creados, omitidos, inválidos con razones. Agrega pruebas unitarias del parser/validador.

**Prompt (frontend: import asistido y host link)**
> En `monotickets-platinum`, crea UI para importar invitados por CSV con vista previa y validaciones (errores por fila). Agrega “Host Link” por evento: un enlace compartible para que el host agregue invitados sin acceder al panel completo (definir token/permiso limitado). Flujo ≤4 acciones.

---

## 5) Módulo de Invitaciones (generación, estados, límites)

**Requerimientos (SRS)**
- Generación y distribución de invitaciones digitales.
- Máx. 1000 invitaciones por evento.

**Prompt (backend: generar invitaciones por invitado + estados)**
> En `monotickets-api`, implementa/ajusta el módulo `invitations` para generar una invitación por invitado (o múltiples si el producto lo requiere, pero justifica). Agrega estados coherentes con el SRS: creada, enviada, entregada, fallida. Enforce máximo 1000 invitaciones por evento. Registra `sentAt`/`deliveredAt` y la “fecha de recepción” necesaria para la regla de revocación de RSVP (20 días). Expón endpoints para: listar invitaciones por evento, reintentar envío, y ver detalle de una invitación (sin PII en endpoints públicos).

---

## 6) Módulo de Delivery (SMS + WhatsApp, reintentos, número inválido)

**Requerimientos (SRS)**
- Envío siempre por doble canal: SMS y WhatsApp.
- Hasta 3 reintentos automáticos por canal.
- Reenvío manual permitido.
- Número inválido: marcar inválido + sugerir alternativas (link/QR, imprimir lista/QR).

**Prompt (backend: orquestador de envíos con 2 canales + retries)**
> En `monotickets-api`, implementa un “Delivery Orchestrator” para invitaciones: al disparar envío, debe intentar SMS y WhatsApp (en paralelo o secuencia), registrar cada intento en `delivery_attempts`, reintentar automáticamente hasta 3 veces por canal (backoff simple), y marcar número como inválido si el proveedor lo indica (o si falla validación E.164). Expón endpoints: `POST /events/:id/invitations/send` (bulk), `POST /invitations/:id/resend`, y `GET /events/:id/delivery/summary`. Incluye un proveedor mockeable (por env var) para test. Agrega pruebas unitarias del orquestador.

**Prompt (frontend: estado de envío + alternativas)**
> En `monotickets-platinum`, en el panel del Planner implementa una tabla de invitaciones con estado por canal (SMS/WhatsApp), reintentar manual, y para números inválidos mostrar alternativas accionables: “Copiar link”, “Descargar/Imprimir QR”, “Exportar lista”. Mantén el flujo principal simple (≤4 acciones).

---

## 7) Módulo de RSVP (confirmar, revocar, manual por planner)

**Requerimientos (SRS)**
- Planner puede confirmar manualmente.
- Invitado puede revocar confirmación hasta 20 días desde recepción de invitación.

**Prompt (backend: reglas de RSVP con ventana temporal)**
> En `monotickets-api`, ajusta/implementa `rsvp` para soportar: `PENDING/CONFIRMED/DECLINED`, timestamps (`respondedAt`), y la regla de revocación: un invitado puede cambiar su RSVP hasta 20 días desde “receivedAt” de la invitación (define y persiste receivedAt al primer delivery exitoso). Implementa endpoints públicos (sin auth) usando un token seguro de invitación: `GET /public/invitations/:token/rsvp` y `POST /public/invitations/:token/rsvp`. Además, implementa endpoint privado para PLANNER: confirmar/editar RSVP manualmente. Agrega pruebas de la ventana de 20 días y edge cases (sin receivedAt, invitación no entregada).

**Prompt (frontend: RSVP invitado)**
> En `monotickets-platinum`, en la landing del invitado implementa el componente RSVP: botones Confirmar / No asistir, confirmación visual inmediata, y si está fuera de la ventana de 20 días deshabilitar con mensaje claro. Asegura accesibilidad (WCAG 2.1 AA) en interacción y contraste.

---

## 8) Módulo de QR Dinámico (JWT + validez por fecha + guestCount)

**Requerimientos (SRS)**
- QR firmado con JWT.
- Validación de firma en cada escaneo.
- Válido sólo el día del evento (CDMX).
- guestCount 1–10.

**Prompt (backend: emisión/validación de QR JWT)**
> En `monotickets-api`, implementa QR dinámico basado en JWT para invitaciones: endpoint para obtener/refresh del token (público o semi-público) y lógica de validación que verifique firma, eventId/invitationId, y que la fecha actual en CDMX esté dentro de 00:00–23:59 del día del evento. Define claims mínimas: invitationId, eventId, guestId, guestCount, iat, exp (fin del día). Evita exponer PII en el token. Incluye pruebas unitarias de validación de fecha (CDMX) y expiración.

---

## 9) Módulo de Escaneo y Control de Acceso (entrada parcial + registro persistente)

**Requerimientos (SRS)**
- Escaneo en sitio por Staff (cámara).
- Entrada parcial permitida: staff marca quién entra desde lista de nombres.
- `remaining_count` disminuye en cada acceso.
- Registro persistente de escaneos.
- Feedback visual inmediato en escaneo.

**Prompt (datos + backend: entradas parciales y auditoría)**
> En `monotickets-api`, rediseña/completa el modelo para soportar entrada parcial por invitación: persistir `remainingCount` (inicial = guestCount) y registrar cada ingreso con nombre/identificador del sub-invitado (si aplica) o al menos “n unidades” ingresadas por scan. Implementa endpoint `POST /scanner/scan` (STAFF) que reciba el QR JWT, valide, detecte duplicados, y permita confirmar entrada parcial (selección o cantidad) reduciendo remainingCount de forma transaccional (evitar race conditions). Devuelve estados: VALID, DUPLICATE, INVALID, EXPIRED + payload para UI. Guarda un log/auditoría de cada intento.

**Prompt (frontend: scanner móvil con feedback)**
> En `monotickets-platinum`, implementa la vista “Scanner Staff” mobile-first usando la cámara del dispositivo. Flujo: escanear → validar → mostrar resultado inmediato (válido/duplicado/inválido/expirado) y, si es válido y guestCount>1, permitir seleccionar cuántos ingresan o elegir nombres (según el modelo definido) y confirmar. Maneja modo offline degradado (si no hay red, mostrar aviso y permitir reintento; no inventar validaciones offline si no hay soporte). Accesible y con vibración/sonido opcional.

---

## 10) Métricas por Evento + Métricas Globales + KPIs MVP

**Requerimientos (SRS)**
- Métricas por evento y globales.
- KPIs: entregadas ≥95%, RSVP ≥65% sobre entregadas, show-up ≥90% sobre confirmados, etc.

**Prompt (backend: agregaciones y endpoints)**
> En `monotickets-api`, implementa endpoints de métricas: (1) por evento (PLANNER dueño + DIRECTOR_GLOBAL) y (2) globales (sólo DIRECTOR_GLOBAL). Calcula: total invitados, invitaciones creadas, entregadas, fallidas, RSVP confirmados/declinados, asistencia (scans únicos y parciales), show-up sobre confirmados, time-to-rsvp (p50/p90) y tasas del KPI. Asegura queries eficientes (índices si aplica). Incluye pruebas para cálculos clave.

**Prompt (frontend: dashboards)**
> En `monotickets-platinum`, implementa: Dashboard Planner por evento (cards + tabla) y Dashboard Director Global (métricas agregadas + alertas). Muestra KPIs del SRS con colores/umbrales y tooltips de definición. Mobile-first.

---

## 11) Exportación de Reportes (CSV/Excel)

**Requerimientos (SRS)**
- Exportar CSV/Excel de: invitados, RSVP, asistencia.

**Prompt (backend: export seguro y paginado)**
> En `monotickets-api`, crea endpoints de exportación por evento para PLANNER dueño: `GET /events/:id/exports/guests.csv`, `.../rsvp.csv`, `.../attendance.csv` (y opcional xlsx). Incluye cabeceras correctas, escape de CSV, y evita exponer datos de otros eventos. Para datasets grandes (1000) soporta streaming o generación eficiente. Agrega prueba de contrato (headers + columnas).

**Prompt (frontend: descargas)**
> En `monotickets-platinum`, agrega botones “Exportar” en el panel del evento con selección: Invitados, RSVP, Asistencia. Descarga con nombre de archivo consistente e indicador de progreso.

---

## 12) Alertas del Director Global (>10% fallas de envío por evento)

**Requerimientos (SRS)**
- Si >10% envíos fallan en un evento: alerta visible en panel Director Global.

**Prompt (backend: evaluación de alertas)**
> En `monotickets-api`, implementa la regla de alertas: cuando un evento tenga ratio de fallas de envío >10% (define denominador: intentos o invitaciones), crea/actualiza una alerta persistente asociada al evento con severidad y timestamps. Exponer endpoints para listar alertas activas y resolverlas. Asegura que sólo DIRECTOR_GLOBAL acceda.

---

## 13) Cumplimiento: anonimización 12 meses + borrado bajo solicitud + retención de métricas

**Requerimientos (SRS)**
- Anonimizar datos personales a 12 meses.
- Conservar métricas agregadas.
- Borrado manual bajo solicitud del planner.

**Prompt (backend: jobs de compliance + borrado)**
> En `monotickets-api`, define e implementa un módulo `compliance` con: (1) job programado que anonimice PII (nombre, email, teléfono) de invitados e invitaciones después de 12 meses del evento (o cierre), manteniendo métricas agregadas; (2) endpoint para PLANNER solicitar borrado manual por evento/invitación (con confirmación), registrando auditoría. Especifica qué campos se anonimizan y cómo (hash/sustitución). Incluye pruebas unitarias de elegibilidad por fecha.

---

## 14) Seguridad, Confiabilidad y Usabilidad (NFRs como tareas verificables)

**Requerimientos (SRS)**
- JWT firmado, validación por escaneo, QR inválido fuera de fecha.
- Disponibilidad 99% (observabilidad básica).
- Mobile-first, feedback inmediato, WCAG 2.1 AA.

**Prompt (hardening: OWASP + rate limits + logging)**
> En `monotickets-api`, implementa hardening mínimo OWASP: rate limiting para endpoints públicos/escaneo, validación estricta de inputs, logging estructurado de acciones críticas, y sanitización de errores (no filtrar stack traces). Revisa JWT secrets y rotación (al menos por env). Agrega un documento corto con amenazas y mitigaciones (top 10 relevantes) y tests de rate limit básico.

**Prompt (frontend: accesibilidad + performance budgets)**
> En `monotickets-platinum`, aplica mejoras de accesibilidad WCAG 2.1 AA (focus, contraste, labels) en Landing + Scanner + Dashboard. Agrega budgets de performance (bundle size) y un checklist de QA manual para móvil (Android/iOS).

---

## 15) Checklist de aceptación por historia (para QA)

Usar esta plantilla por cada entrega:
- **Funcional**: casos “happy path” + 3 edge cases (límites, permisos, fechas CDMX).
- **Seguridad**: acceso por rol + no exponer PII en endpoints públicos.
- **Datos**: migración aplicada + backfill si aplica + índices revisados.
- **UX móvil**: ≤4 acciones, feedback inmediato, textos claros.
- **Observabilidad**: logs de auditoría para publish/send/scan/rsvp.
- **Rendimiento**: landing ≤3s y ≤3MB (medido).

