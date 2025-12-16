# SRS — Monotickets Platinum v1.2
## Sistema de Invitaciones Digitales para Eventos Privados (Iteración de Reconstrucción)

> Versión reconstruida tomando como baseline el **SRS v1.1** y el alcance implementado en `Monotickets_Platinum_Backend_Completo_v1.1.md`, además de los avances recientes en el backend actual (`monotickets-api`).  
> El objetivo de la v1.2 es documentar el estado real del producto después de los sprints 0–2 y dejar claros los requerimientos que ya están cubiertos vs. los pendientes.

---

## 1. Introducción

### 1.1 Propósito
Definir de manera formal los requerimientos funcionales y de datos del sistema, marcando **qué está implementado** y **qué sigue pendiente** después de la comparación entre el backend completo v1.1 y el proyecto actual. Este documento se usará para QA, desarrollo, producto y auditoría.

### 1.2 Alcance
- Invitaciones digitales para eventos privados (PDF + Premium).
- Plantillas PDF con placement de QR y catálogos por categoría.
- Landing Premium con secciones controladas y soporte a efectos “Flipbook” y “Pergamino”.
- Distribución manual SMS/WhatsApp, confirmaciones (RSVP) y control de acceso con QR dinámico.
- Experiencias adicionales para invitado (ICS + modo recuerdo).
- Dashboard operativo, exportaciones CSV/XLSX, métricas por evento y globales (director).

### 1.3 Referencias
- `SRS_Monotickets_Platinum_v1.1.md`
- `Monotickets_Platinum_Backend_Completo_v1.1.md`
- `FE_requirements_Monotickets_Platinum_v1.1.md`
- `BE_updates_OpenAPI_Monotickets_Platinum_v1.1.md`
- `EXPORT_FORMATOS_MONOTICKETS.md`
- `GAP_REPORT_SRS_vs_IMPLEMENTACION.md`

---

## 2. Cambios clave vs. v1.1

| Tema | Estado actual | Comentario |
| --- | --- | --- |
| Plantillas PDF + placement QR | **Implementado** | Catálogo + upload + `PATCH /events/{id}/pdf-template/qr-placement` con coordenadas normalizadas. |
| Premium config (Flipbook/Scroll) | **En alcance** | Modelo definido, endpoints GET/PATCH documentados; falta UI final. |
| Exportaciones CSV/Excel | **Implementado (CSV/XLSX)** | `GET /exports/...?:format=` con layouts documentados. |
| Entregas SMS/WhatsApp + reintentos | **Implementado** | `POST /invitations/send` usa `DeliveryService`; job de reintentos (3 intentos). |
| RSVP persistente | **Implementado** | `GET/POST /events/:id/rsvp-config`, ventana de 20 días calculada. |
| ICS + recordatorios | **Pendiente** | Endpoint público `POST /public/invite/{token}/calendar/ics` descrito, aún no implementado. |
| Modo recuerdo (memory) | **Pendiente** | Requiere endpoints `GET /public/invite/{token}/memory(.pdf)`. |
| Métricas/KPIs + alertas director | **Implementado** | `/metrics/events/:id` y `/metrics/global` con acceso controlado; falta endpoint de alertas. |
| OpenAPI | **Generado** | `npm run generate:openapi` -> `docs/contracts/OPENAPI_monotickets.yaml`; falta publicarlo en CI y validar con Spectral. |

---

## 3. Requerimientos Funcionales Actualizados

### 3.1 Plantillas PDF y placement QR
- **Catálogo:** `GET /templates/pdf?category=` devuelve plantillas del sistema (thumb, pdfUrl, flags).
- **Upload planner:** `POST /templates/pdf/upload` (multipart).
- **Seleccionar plantilla evento:** `POST /events/{eventId}/pdf-template/select`.
- **Upload directo a evento:** `POST /events/{eventId}/pdf-template/upload`.
- **Placement QR:** `PATCH /events/{eventId}/pdf-template/qr-placement`.
  - Campos: `page_index`, `x`, `y`, `w`, `h`, `rotation`.
  - Validaciones: valores entre 0..1, `rotation ∈ {0,90,180,270}`, `w/h ≥ 0.05`.

### 3.2 Premium Config
- Endpoints `GET /events/{eventId}/premium-config` y `PATCH /events/{eventId}/premium-config`.
- Modelo:
  - `effect`: `FLIPBOOK` o `SCROLL`.
  - `colors`: `primary`, `secondary`, `accent`, `background`.
  - `sections`:
    - `cover`, `story`, `gallery` (máx 5 imágenes, 2MB c/u), `location`, `extras` (máx 2), `rsvp`.
  - `a11y.reduceMotionDefault`.
- Validar contraste (cuando FE lo soporte) y límites definidos.
- Estado: **Implementado** con almacenamiento `premium_configs` (JSON).

### 3.3 Invitado: Calendario + Recordatorios (ICS)
- `POST /public/invite/{token}/calendar/ics`
  - Body:
    ```json
    {
      "reminders": ["P3D","P7D","P15D","P1M"]
    }
    ```
    - Valores válidos: `P3D`, `P7D`, `P15D`, `P1M`. Máximo 4 elementos.
  - Validaciones:
    - Token debe representar una invitación activa (aunque el evento esté cerrado).
    - Si el evento fue bloqueado, responder `423 Locked`.
  - Response:
    - `Content-Type: text/calendar; charset=utf-8`.
    - Un único `VEVENT` con `DTSTART/DTEND` en `America/Mexico_City`, `SUMMARY`, `DESCRIPTION`, `LOCATION`.
    - Un `VALARM` por cada recordatorio (`TRIGGER:-PXD`).
  - Observaciones:
    - Debe incluir `UID` y `URL` para compatibilidad con Google/Apple/Outlook.
    - Si el invitado ya tiene RSVP `DECLINED`, retornar `409` (no aplica).
- Estado: **Implementado** en `POST /public/invite/{token}/calendar/ics` (Sprint 2+).

### 3.4 Modo recuerdo post-evento
- Endpoints obligatorios:
  - `GET /public/invite/{token}/memory`
    - JSON (para PWA) o HTML según `Accept`.
    - Estructura mínima:
      ```json
      {
        "event": {...},
        "guest": {...},
        "sections": {...},
        "gallery": [],
        "qrStatus": "MEMORY_ONLY"
      }
      ```
  - `GET /public/invite/{token}/memory.pdf`
    - `Content-Type: application/pdf`.
    - Genera PDF usando la misma plantilla configurada (PDF o Premium renderizada).
- Reglas:
  - Debe permanecer accesible aun con `invitation.status = FULLY_USED` o evento `CLOSED`.
  - No mostrar botones de confirmación, reenvío o QR escaneable.
  - TTL configurable mediante `MEMORY_TTL_MONTHS` (default 12 meses); fuera de ventana responde `404`.
- Estado: **Implementado** en `GET /public/invite/{token}/memory` y `/memory.pdf` (usa `PremiumConfig` real para secciones y PDF).

### 3.5 Delivery SMS/WhatsApp
- Manual: `POST /invitations/send` (IDs) y `POST /events/{eventId}/deliveries/send`.
- Reintentos automáticos: job (`DeliveryRetryService`) cada 5 minutos; máximo 3 intentos por canal antes de `FAILED`.
- Registrar `inviteReceivedAt` al primer envío (`SENT`) exitoso.
- `DeliveryAttempt` guarda canal, estado, proveedor, error.

### 3.6 RSVP y Scanner
- `RsvpConfig`: `allowRsvp`, `rsvpDeadlineDays`, `revocationWindowDays`.
- Invitado puede terminar en `DECLINED` si está dentro de la ventana de 20 días desde `inviteReceivedAt`.
- Planner puede confirmar manualmente (`manualConfirm`).
- Scanner:
  - `POST /scanner/validate` retorna `guestCount`, `remainingCount`, `guestNames[]`, `status`.
  - `POST /scanner/entry/confirm` actualiza `remainingCount` y estado (`PARTIALLY_USED` o `FULLY_USED`).

### 3.7 Estadísticas y alertas
- `GET /metrics/events/:eventId` (Planner dueño o Director Global):
  ```json
  {
    "deliveryRate": 97.5,
    "rsvpRate": 68.2,
    "showUpRate": 91.0,
    "avgTimeToRsvp": 3.4,
    "totalInvitations": 150,
    "deliveredInvitations": 145,
    "confirmedGuests": 120,
    "declinedGuests": 15,
    "totalScans": 110
  }
  ```
- `GET /metrics/global` (solo Director Global) agrega los mismos KPIs a nivel ecosistema.
- Alertas Director:
  - Condición: `failed_invites / total_invites > 0.10` o eventos bloqueados manualmente.
  - Endpoints requeridos:
    - `GET /director/alerts` (implementado) → lista de alertas con severidad, planner y evento (tipos `DELIVERY_FAILURE`, `EVENT_BLOCKED`).
    - `GET /director/planners` y `PATCH /director/planners/{plannerId}` (implementado) para activar/desactivar planners.
    - `PATCH /director/events/{eventId}` (implementado) para bloquear/desbloquear.
  - Registrar `DEC-00X` para definir mejoras futuras (persistencia de alertas, notificaciones en tiempo real).

### 3.8 Exportaciones
- Endpoints:
  - `GET /exports/guests/:eventId?format=csv|xlsx`
  - `GET /exports/rsvp/:eventId?format=csv|xlsx`
  - `GET /exports/attendance/:eventId?format=csv|xlsx`
- Protegidos por JWT + Roles (`PLANNER` dueño o `DIRECTOR_GLOBAL`).
- Layouts oficiales documentados en `EXPORT_FORMATOS_MONOTICKETS.md`.
- CSV: `text/csv`, UTF-8. Excel: `.xlsx`.

### 3.9 OpenAPI y contratos
- Generar con `npm run generate:openapi` → `docs/contracts/OPENAPI_monotickets.yaml`.
- Validar con Spectral y publicar en CI (pendiente).
- Tags adicionales a incluir en el contrato: Templates, Premium, Calendar, Memory.
- Nuevos schemas: `PdfTemplate`, `PdfQrPlacement`, `PremiumConfig`, `IcsRemindersRequest`, `MemoryView`, `ExportFormat`.

---

## 4. Requerimientos de Datos y Exportación

### 4.1 Columnas mínimas
Ver `EXPORT_FORMATOS_MONOTICKETS.md`. Resumen:
- Invitados: `fullName`, `phone`, `email`, `guestCount`, `rsvpStatus`, `inviteReceivedAt`, `confirmedAt`, `declinedAt`.
- RSVP: `fullName`, `rsvpStatus`, `guestCount`, `confirmedAt`, `declinedAt`.
- Asistencia: `guestName`, `scannedAt`, `status`, `enteredNames`, `peopleCount`.

### 4.2 Identificadores
- IDs únicos (`uuid`) para `Event`, `Guest`, `Invitation`, `Template`, `DeliveryAttempt`.
- `eventId` obligatorio en `RsvpConfig`, `PremiumConfig`, `EventPdfConfig`.

### 4.3 Retención
- Retención de 12 meses, luego anonimizar (mantener métricas).
- Planner puede solicitar borrado total antes de ese plazo.

---

## 5. Trazabilidad y Artefactos

| Artefacto | Descripción |
| --- | --- |
| `GAP_REPORT_SRS_vs_IMPLEMENTACION.md` | Seguimiento de divergencias (DEC-001..005, etc.). |
| `PLAN_DESARROLLO_BACKEND.md` | Plan por sprints: S0 (estados), S1 (delivery+RSVP), S2 (exports+metrics+OpenAPI). |
| `EXPORT_FORMATOS_MONOTICKETS.md` | Detalle de columnas CSV/XLSX. |
| `docs/contracts/OPENAPI_monotickets.yaml` | Contrato generado desde Nest. |

---

## 6. Estado del Documento
- Versión: **1.2 (reconstrucción)**
- Fecha: 15/12/2025
- Autor: Equipo Monotickets
- Pendientes críticos:
  1. Implementar endpoints ICS y modo recuerdo.
  2. Publicar contrato OpenAPI y validar con Spectral.
  3. Documentar alertas Director (`GET /director/alerts`) y endpoints `PATCH /director/...`.
  4. Completar pruebas E2E para exportaciones Excel.
