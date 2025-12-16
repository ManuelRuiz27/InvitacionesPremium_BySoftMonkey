# Monotickets Platinum v1.1  
## Requerimientos COMPLETOS de Backend (API + Reglas + Modelos + Endpoints)

> Documento único para **equipo Backend**.  
> Incluye: **módulos**, **reglas de negocio**, **estados**, **modelos mínimos**, **endpoints** (incluye públicos), y **contratos IO** en JSON.  
> Alcance: **MVP Eventos 100% privados** (sin pagos / sin modelo de negocio).

---

## 0) Convenciones

### 0.1 Zona horaria y fechas
- TZ global: `America/Mexico_City`
- Cierre automático: **hora del evento + 72 horas**.
- QR válido: **solo el día del evento** (según TZ global).

### 0.2 Límites MVP
- Simultáneos: **hasta 5 eventos simultáneos** de **hasta 1000 invitados** cada uno.
- Máx invitaciones por evento: **1000**
- Máx personas por invitación (QR grupal): **10**
- Landing Premium: galería máx **5 fotos**, **2MB** c/u
- Reintentos delivery (SMS y WhatsApp): **3** antes de `FAILED`

### 0.3 Canales de envío
- Orden: **SMS primero, WhatsApp después siempre**
- Envío: **manual** (planner decide cuándo enviar)
- No hay “opt-out” MVP

### 0.4 Retención y privacidad
- Retención: **12 meses**
- Al cumplir 12 meses: **Anonimizar** datos personales, conservar métricas.
- Planner puede solicitar borrado total del evento antes de 12 meses.

---

## 1) Entidades, estados y transiciones

### 1.1 Event
Estados:
- `DRAFT` (interno)
- `PUBLISHED` (interno; el FE lo muestra como “Listo para enviar”)
- `CLOSED` (automático al pasar `event_at + 72h`)
- `BLOCKED` (por Director)

Transiciones:
- `DRAFT -> PUBLISHED` (solo planner)
- `PUBLISHED -> CLOSED` (automático)
- `* -> BLOCKED` (Director)
- `BLOCKED -> PUBLISHED` (Director, si aún no CLOSED)

### 1.2 Guest RSVP
Estados:
- `PENDING`
- `CONFIRMED`
- `DECLINED`

Reglas:
- Invitado puede pasar a `DECLINED` **solo dentro de 20 días desde received_at**.
- Planner puede marcar manualmente `CONFIRMED` sin landing.

### 1.3 Invitation / QR
Estados invitation:
- `CREATED`
- `REVOKED`

Estados QR (derivado):
- `INACTIVE` (no confirmado)
- `ACTIVE` (confirmado y día del evento)
- `EXPIRED` (fuera del día del evento)
- `USED_PARTIAL`
- `USED_FULL`

Reglas de uso (entrada parcial):
- Si `guestCount > 1`, el staff selecciona **quién entra** y se descuenta `remainingCount`.
- Permitir entrada parcial: **sí**
- Si `remainingCount` llega a 0: `USED_FULL`.

### 1.4 Delivery
Estados por canal:
- `PENDING`
- `SENT`
- `DELIVERED` *(si proveedor lo confirma; si no, usar SENT)*
- `FAILED`
- `INVALID_NUMBER`

Reglas:
- Si teléfono inválido: marcar como `INVALID_NUMBER` y sugerir alternativas (impresión / link para compartir).
- Si se actualiza teléfono:
  - Si ya estaba confirmado: **no** reabrir delivery.
  - Si no confirmado: volver a `PENDING` y permitir reenvío manual.

---

## 2) Modelos mínimos (DB)

> Nombres sugeridos. Ajusta a tu ORM (Prisma/TypeORM).

### 2.1 Planner
- `id`
- `name`
- `email`
- `status` (ACTIVE/INACTIVE)
- `brandDefaults` (logo, colors)
- timestamps

### 2.2 Event
- `id`
- `plannerId`
- `name`
- `category` (BODA, XV, GRADUACION, etc.)
- `eventAt` (datetime)
- `venueText`
- `status`
- `inviteMode` (PDF|PREMIUM)
- `guestCountDefault` (1..10)
- `allowPartialEntry` (bool)
- `publishedAt`
- `closedAt`
- timestamps

### 2.3 Guest
- `id`
- `eventId`
- `fullName`
- `phone`
- `rsvpStatus`
- `rsvpAt`
- `declineAt`
- `notes`
- `guestCount` (1..10)
- `receivedAt` (primer envío real)
- timestamps

### 2.4 Invitation
- `id`
- `eventId`
- `guestId`
- `token` (public)
- `status` (CREATED/REVOKED)
- `qrSecret` / `qrJti`
- `remainingCount`
- `usedCount`
- timestamps

### 2.5 DeliveryAttempt
- `id`
- `invitationId`
- `channel` (SMS|WHATSAPP)
- `status`
- `attemptNo`
- `providerRef`
- `errorCode`
- `errorMsg`
- timestamps

### 2.6 Templates (PDF)
- `id`
- `ownerPlannerId` *(null = system template)*
- `category`
- `name`
- `pdfUrl`
- `thumbUrl`
- timestamps

### 2.7 EventPdfConfig
- `eventId`
- `templateId`
- `placement` (page_index,x,y,w,h,rotation)
- timestamps

### 2.8 PremiumConfig
- `eventId`
- `effect` (FLIPBOOK|SCROLL)
- `colors`
- `sections` (json)
- timestamps

### 2.9 Media
- `id`
- `ownerPlannerId`
- `type` (IMAGE)
- `url`
- `sizeBytes`
- `mime`
- timestamps

### 2.10 Staff
- `id`
- `eventId` *(o plannerId si es reusable)*
- `name`
- `token` (login)
- `status`
- timestamps

### 2.11 Audit (opcional MVP)
- En MVP: **NO requerido** por decisión.

---

## 3) Autenticación y autorización

### 3.1 Auth
- JWT user (planner/director): **8h**
- JWT staff: **24h**
- RBAC mínimo:
  - Planner: CRUD de sus eventos
  - Staff: validate/confirm entradas
  - Director: gestionar planners y bloquear eventos + ver métricas globales

---

## 4) Endpoints — Planner (privados)

### 4.1 Perfil
- `GET /planners/me`
- `GET /planners/me/settings`
- `PATCH /planners/me/settings`

**settings body**
```json
{
  "brandDefaults": {
    "logoMediaId": "med_123",
    "colors": { "primary":"#...", "secondary":"#...", "accent":"#...", "background":"#..." }
  },
  "preferredInviteMode": "PDF"
}
```

---

### 4.2 Eventos
- `POST /events`
- `PATCH /events/{eventId}`
- `GET /events?owner=me&limit=20`
- `GET /events/{eventId}`
- `GET /events/{eventId}/stats`
- `GET /events/{eventId}/metrics`

**POST /events body**
```json
{
  "name": "Boda Ana y Luis",
  "category": "BODA",
  "eventAt": "2026-02-14T19:00:00-06:00",
  "venueText": "Hacienda X",
  "inviteMode": "PDF",
  "guestCountDefault": 2,
  "allowPartialEntry": true
}
```

**Reglas**
- `PUBLISHED` solo lo activa el planner (ver 4.8).

---

### 4.3 Invitados
- `GET /events/{eventId}/guests`
- `PATCH /guests/{guestId}`
- `POST /guests/{guestId}/rsvp/confirm`
- `POST /guests/{guestId}/rsvp/decline`

**PATCH guest**
```json
{ "fullName":"...", "phone":"+52...", "guestCount":4, "notes":"..." }
```

---

### 4.4 Importación invitados
- `POST /events/{eventId}/guests/import` (multipart CSV/Excel)

**Response**
```json
{ "inserted": 120, "updated": 0, "invalidRows": 3, "errors": [{ "row": 7, "reason": "phone invalid"}] }
```

---

### 4.5 Formularios (RSVP / Hosts)
- `POST /events/{eventId}/forms/rsvp`
- `POST /events/{eventId}/forms/hosts`

**Response**
```json
{ "public_url":"https://.../public/form/rsvp/{formToken}" }
```

---

### 4.6 Generación de invitaciones
- `POST /events/{eventId}/invitations/generate`
- `GET /events/{eventId}/invitations?limit=1000`

**Reglas**
- Crea 1 invitación por guest
- Inicializa `remainingCount = guestCount` (o default si guest no lo tiene)

---

### 4.7 Revocar invitación
- `POST /invitations/{invitationId}/revoke`

**Reglas**
- Marca REVOKED
- QR no válido
- Delivery se bloquea

---

### 4.8 Publicar evento (interno)
- `POST /events/{eventId}/publish`

**Regla**
- Solo planner; si bloqueado o cerrado → 409.

---

### 4.9 Delivery (manual)
- `POST /events/{eventId}/deliveries/send`
- `POST /invitations/{invitationId}/deliveries/resend`

**Regla canal**
1) SMS
2) WhatsApp

**Body opcional**
```json
{ "channels": ["SMS","WHATSAPP"] }
```

**Respuesta**
```json
{ "queued": 500, "skippedInvalid": 12 }
```

---

### 4.10 Exportaciones
- `GET /events/{eventId}/export/guests.csv`
- `GET /events/{eventId}/export/guests.xlsx`

---

## 5) Endpoints — Templates PDF

### 5.1 Catálogo
- `GET /templates/pdf?category={category}`

### 5.2 Upload
- `POST /templates/pdf/upload` (multipart PDF)

### 5.3 Aplicar template a evento
- `POST /events/{eventId}/pdf-template/select`
- `POST /events/{eventId}/pdf-template/upload` (multipart)

### 5.4 QR placement
- `PATCH /events/{eventId}/pdf-template/qr-placement`

Body:
```json
{ "page_index": 0, "x": 0.7, "y": 0.8, "w": 0.2, "h": 0.2, "rotation": 0 }
```

---

## 6) Endpoints — Premium Config + Media

### 6.1 Premium Config
- `GET /events/{eventId}/premium-config`
- `PATCH /events/{eventId}/premium-config`

### 6.2 Media upload
- `POST /media/upload` (multipart)
- Validar límites (2MB por foto si es galería)

---

## 7) Endpoints — Invitado (públicos)

### 7.1 Ver invitación
- `GET /public/invite/{token}`

### 7.2 Confirmar
- `POST /public/invite/{token}/rsvp/confirm`

### 7.3 Declinar (20 días desde received_at)
- `POST /public/invite/{token}/rsvp/decline`

### 7.4 PDF (si modo PDF)
- `GET /public/invite/{token}/pdf`

### 7.5 Calendario ICS
- `POST /public/invite/{token}/calendar/ics`
Body:
```json
{ "reminders": ["P3D","P7D","P15D","P1M"] }
```
Response: `text/calendar`

### 7.6 Acceso día del evento
- `GET /public/invite/{token}/access`

Response:
```json
{
  "accessEnabled": true,
  "guestCount": 4,
  "qr": { "payload": "..." }
}
```

### 7.7 Recuerdo post-evento
- `GET /public/invite/{token}/memory`
- `GET /public/invite/{token}/memory.pdf`

---

## 8) Endpoints — Staff / Scanner

### 8.1 Login token
- `POST /staff/login`
Body:
```json
{ "token": "STAFF-XXXX" }
```

### 8.2 Validar QR
- `POST /scanner/validate`
Body:
```json
{ "qrPayload": "..." }
```

Response mínimo:
```json
{
  "status": "VALID|INVALID|EXPIRED|REVOKED|NOT_CONFIRMED|EVENT_BLOCKED",
  "guestCount": 4,
  "remainingCount": 3,
  "guestNames": ["Juan Perez","Ana Lopez"],
  "notes": "..."
}
```

### 8.3 Confirmar entrada parcial
- `POST /scanner/entry/confirm`
Body:
```json
{ "invitationId": "inv_123", "enteredNames": ["Juan Perez"] }
```

---

## 9) Director (privado)

### 9.1 Planners
- `GET /director/planners`
- `PATCH /director/planners/{plannerId}` (activar/desactivar)

### 9.2 Bloquear evento
- `PATCH /director/events/{eventId}` `{ "action": "BLOCK|UNBLOCK" }`

### 9.3 Alertas (fallos delivery)
- `GET /director/alerts`
Regla:
- disparar alerta si `failed_rate > 10%` por evento (visible en panel director)

---

## 10) Jobs / Automatizaciones backend

### 10.1 Cierre automático
Job cada 5–10 min:
- Si `now >= eventAt + 72h` y status != CLOSED → set CLOSED.

### 10.2 Retención 12 meses
Job diario:
- Si `now >= eventAt + 12 months` → anonimizar datos personales (Guest: nombre/phone) conservando métricas.

### 10.3 Delivery reintentos
Job por cola:
- 3 intentos por canal
- idempotencia por `invitationId + channel + attemptNo` y `providerRef`

---

## 11) Respuestas de error (formato unificado)
Formato:
```json
{ "statusCode": 400, "error": "Bad Request", "message": "..." }
```

---

## 12) Fuera del MVP
- CSS custom libre
- Recordatorios automáticos por sistema
- Auditoría detallada (quién hizo qué) *(no requerido por decisión actual)*
