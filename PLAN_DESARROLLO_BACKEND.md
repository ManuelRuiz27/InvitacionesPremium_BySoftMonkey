# Plan de desarrollo backend - Monotickets Platinum

Objetivo general: cerrar los huecos identificados en `GAP_REPORT_SRS_vs_IMPLEMENTACION.md` y dejar el backend listo para QA y despliegue productivo, manteniendo trazabilidad con el SRS v1.2.

## Cadencia y metricas
- Sprints de 2 semanas (excepto Sprint 0 que se ejecuta ahora y termina en 1 semana).
- Indicadores por sprint:
  - % de historias con pruebas automatizadas.
  - Tiempo medio de ciclo (ticket ``ready`` -> ``done``).
  - Numero de regresiones detectadas por verificacion (`verify_*.ts`).

## Sprint backlog

### Sprint 0 (en curso) - Lifecycle del evento y cimientos operativos
- **Objetivo**: habilitar la maquina de estados de eventos (DRAFT, PUBLISHED, CLOSED, BLOCKED) y exponer endpoints seguros para publicar, cerrar, bloquear y desbloquear eventos.
- **Historias**:
  1. Endpoint `PATCH /events/:id/publish` (solo planner dueño).
  2. Endpoint `PATCH /events/:id/close` (planner o director global).
  3. Endpoint `PATCH /events/:id/block` y `PATCH /events/:id/unblock` (solo director global) con auditoria de quien bloquea.
  4. Hook en `ScannerService`/`InvitationsService` para respetar estado `BLOCKED`.
- **Entregables**:
  - Servicio y controlador actualizados + documentacion Swagger.
  - Pruebas unitarias basicas en servicios.
  - Nota en `GAP_REPORT` marcando avance.
- **DoD**:
  - Reglas de transicion validadas (no se puede publicar un evento cerrado, etc.).
  - Respuestas API documentadas y validadas via `npm run test events`.

### Sprint 1 - Delivery y RSVP persistente
- **Objetivo**: consolidar el flujo de entrega SMS/WhatsApp y la configuracion RSVP persistente.
- **Historias**:
  1. Integrar `InvitationsService.send` con `DeliveryService` (Twilio + Meta) y registrar `DeliveryAttempt`.
  2. Persistir `inviteReceivedAt` y calcular ventana RSVP de 20 dias.
  3. CRUD completo para `RsvpConfig` por evento via `rsvp-config.service`.
  4. Job de reintentos (en `scheduled-tasks`) para delivery fallido (max 3).
- **Entregables**:
  - Endpoints listos en `delivery.controller.ts` y `rsvp.controller.ts`.
  - Scripts `verify_delivery.ts` y `verify_rsvp.ts` pasando.
  - Documentacion de variables de entorno (`TWILIO_*`, `META_*`).
- **DoD**:
  - 90% de intents de envio con registro en `delivery_attempts`.
  - Config RSVP consultable desde UI (`GET /rsvp/config/:eventId`).
- **Estado (13/12)**:
  - `POST /invitations/send` ya dispara `DeliveryService.sendBulk` y deja invitaciones en `AWAITING_RSVP`.
  - `GET/POST /events/:eventId/rsvp-config` implementados con almacenamiento Prisma + pruebas unitarias.
  - Job de reintentos (`DeliveryRetryService`) ejecutándose cada 5 minutos.
  - Pendiente: documentar variables de entorno productivas y exponer métricas de delivery en UI.

### Sprint 2 - Exportaciones, metricas y contratos
- **Objetivo**: exponer informacion operativa para planners y director global.
- **Historias**:
  1. Exportaciones CSV/Excel para invitados, RSVP y asistencia (ya existe modulo base, falta wiring con permisos y colas).
  2. Endpoints de metricas (`/metrics/events/:id`, `/metrics/global`) con definiciones KPI.
  3. Generar `OPENAPI_monotickets.yaml` versionado en raiz y automatizar en CI.
  4. Endpoints para director global (listado de planners, bloqueo masivo).
- **Entregables**:
  - Modulo `metrics` consolidado + tareas de programacion (`scheduled-tasks`).
  - CSV validados contra muestras del SRS.
  - OpenAPI publicado en carpeta `/docs/contracts`.
- **DoD**:
  - KPIs calculados desde base de datos y validados por `verify_metrics.ts`.
  - OpenAPI pasa validacion `spectral`.
- **Estado (15/12)**:
  - Endpoints `GET /exports/*` asegurados con roles, validación de ownership y soporte CSV/XLSX (`?format=`).
  - `MetricsService` entrega KPIs por evento y globales (solo Director Global), con pruebas unitarias.
  - Artefacto `docs/contracts/OPENAPI_monotickets.yaml` generado vía `npm run generate:openapi`.
  - Pendiente: documentar layouts (TRACEABILIDAD/UI) y publicar el contrato en CI.

### Sprint 3 - Seguridad, privacidad y cierre QA
- **Objetivo**: cubrir RNF de seguridad, privacidad y completar scripts de verificacion.
- **Historias**:
  1. Hardening JWT + rate limit del endpoint `/scanner/validate`.
  2. Procesos `privacy` (anonimizacion a 12 meses, borrado a solicitud).
  3. Plan de pruebas automatizado (al menos 20 pruebas unitarias nuevas).
  4. Evidencias para auditoria (`verify_security_audit.ts`, `verify_privacy.ts`, `verify_closure.ts`).
- **Entregables**:
  - Middlewares/guards configurados.
  - Documentacion de procesos de privacidad en `/docs/privacy.md`.
  - Reporte QA final con checklist.
- **DoD**:
  - Scripts de verificacion sin fallos.
  - Cobertura minima 70% en modulos nuevos.

## Gestion y riesgo
- Dependencias externas: Twilio, Meta WhatsApp, base Postgres. Mockear en tests.
- Riesgos principales:
  1. Credenciales externas no disponibles -> usar modo stub + colas diferidas.
  2. Cambios de schema Prisma -> coordinar migraciones y versionado.
  3. Divergencias SRS v1.2 -> registrar en `DECISION_LOG.md`.

## Primeros pasos ejecutados
- Revisión de estado actual (QR dinamico ya implementado, delivery y exports con modulos base).
- Sprint 0 activo para implementar lifecycle del evento (iniciamos en esta tarea).
