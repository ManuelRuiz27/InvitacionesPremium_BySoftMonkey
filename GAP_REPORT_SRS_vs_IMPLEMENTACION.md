# GAP Report — SRS v1.1 vs Implementación actual

Base: `SRS_Monotickets_Platinum_v1.1.md`  
Objetivo: capturar huecos y divergencias para decidir si se ajusta el SRS (v1.2) o la implementación.

## Alcance revisado (baseline)
- Backend: `monotickets-api/src` (NestJS + Prisma)
- Frontend: `monotickets-platinum/src` (Angular; no auditado en detalle en este baseline)

## Resumen ejecutivo
- Existe cobertura parcial de módulos core: `auth`, `events`, `guests`, `invitations`, `guest` (público), `scanner`, `rsvp`, `director`.
- Hay divergencias relevantes con SRS v1.1 en: QR dinámico (JWT), máquina de estados, entrada parcial, delivery real (SMS/WhatsApp) y configuración de RSVP.

## Hallazgos (alto nivel)

### 1) QR dinámico (SRS) vs token string (as-built)
- **SRS v1.1:** “QR dinámico firmado con JWT y validaciones temporales”.
- **Implementación:** `InvitationsService.generateQRToken()` genera token string tipo `EV-...` y `ScannerService.validateQR()` valida por lookup `qrToken` (sin validación JWT).
- **Decisión requerida:** `DEC-001`.

### 2) Máquina de estados y reglas de scanner
- **SRS v1.1:** estados de scanner y reglas más ricas (`VALID_FULL`, `VALID_PARTIAL`, `NOT_CONFIRMED`, `EVENT_BLOCKED`, etc.) + control grupal/entrada parcial.
- **Implementación:** `ScannerService.validateQR()` retorna `VALID`, `INVALID`, `DUPLICATE` (según enum `ScanStatus`) y no maneja entrada parcial ni prioridad de reglas.
- **Decisión requerida:** `DEC-005` y definición completa de estados (Sprint 2).

### 3) Estados de evento (DRAFT/PUBLISHED/CLOSED/BLOCKED)
- **SRS v1.1:** menciona DRAFT/PUBLISHED y bloqueo/cierre.
- **Implementación:** `EventsService` expone ahora `PATCH /events/:id/publish`, `/close`, `/block`, `/unblock` con transiciones controladas (`Event.status`, `publishedAt`, `closedAt`, `blockedAt`).
- **Decisión requerida:** `DEC-002` marcada como **cubierta** (Sprint 0) salvo feedback adicional de producto.

### 4) Delivery SMS/WhatsApp
- **SRS v1.1:** envío por SMS + WhatsApp con estados y reintentos.
- **Implementación:** `DeliveryModule` implementa intents SMS (Twilio) y WhatsApp (Cloud API) registrando `delivery_attempts`; `POST /invitations/send` ahora usa `DeliveryService.sendBulk` y deja a las invitaciones en `AWAITING_RSVP` con `inviteReceivedAt`. `DeliveryRetryService` corre cada 5 minutos para reprocesar fallas (máx. 3 intentos).
- **Pendiente:** credenciales reales + exponer métricas/alertas de delivery (Sprint 1).
- **Decisión requerida:** `DEC-004` (definir proveedor definitivo y SLA de envío).

### 5) RSVP config (persistencia)
- **SRS v1.1:** reglas y ventanas (incluye “20 días desde recepción”).
- **Implementación:** `RsvpConfig` persistente por evento (`GET/POST /events/:id/rsvp-config`) con validación de acceso, ventana `revocationWindowDays` y pruebas unitarias.
- **Decisión requerida:** `DEC-003` pendiente únicamente de validar parámetros base (días de ventana) con producto.

### 6) Import/Export CSV/Excel
- **SRS v1.1:** carga CSV/Excel + exportación CSV/Excel.
- **Implementación:** `ExportsModule` expone `GET /exports/(guests|rsvp|attendance)/:eventId?format=csv|xlsx`, protegido por JWT/roles y validando ownership; soporta CSV y Excel (xlsx) con columnas normalizadas.
- **Pendiente:** documentación formal de layouts/ejemplos (`TRACEABILIDAD` + contrato UI) en Sprint 3.

### 7) OpenAPI/contratos
- **SRS plan v1.2:** exige OpenAPI verificable.
- **Implementación:** comando `npm run generate:openapi` genera `docs/contracts/OPENAPI_monotickets.yaml` a partir de la configuración actual de Nest/Swagger.
- **Pendiente:** validar cobertura (spectral) y publicar versión oficial (CI/CD) antes de cierre de Sprint 2.

### 8) Calendar ICS + recordatorios
- **SRS v1.1:** invitado puede descargar `.ics` con recordatorios configurables (3d/7d/15d/1m).
- **Implementación:** `POST /public/invite/{token}/calendar/ics` (nuevo) genera ICS con `VALARM` y TZ `America/Mexico_City`, validando RSVP y estado del evento.
- **Pendiente:** exponer este flujo en FE (landing invitado) y registrar decisiones en `DECISION_LOG`.

### 9) Modo recuerdo (memory)
- **SRS v1.1:** invitado puede conservar la invitación como recuerdo (modo lectura + PDF).
- **Implementación:** `GET /public/invite/{token}/memory(.pdf)` devuelve JSON y PDF básico (sin QR activo).
- **Pendiente:** enriquecer contenido con Premium sections reales y definir TTL/anonimización en `privacy`.

### 10) Alertas Director Global
- **SRS v1.1:** alerta si `delivery_failed_rate > 10%` y control de planners/eventos.
- **Implementación:** `GET /director/alerts` calcula tipos `DELIVERY_FAILURE` y `EVENT_BLOCKED`; `PATCH /director/planners/:id` activa/desactiva planners; `PATCH /director/events/:id` bloquea/desbloquea.
- **Pendiente:** persistencia/notificaciones y umbrales configurables (`DEC-00X`).

## Próximos pasos recomendados (Sprint 0 → Sprint 1)
- Acordar decisiones `DEC-001..005` para definir si SRS v1.2 se alinea a as-built o se cambia el código.
- Crear matriz de trazabilidad y empezar a asignar IDs a RF/RNF/DATA/INT/LEGAL/KPI.
