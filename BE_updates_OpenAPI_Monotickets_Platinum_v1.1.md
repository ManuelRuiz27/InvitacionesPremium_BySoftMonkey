# Monotickets Platinum v1.1 — Actualizaciones Backend / OpenAPI (para implementar UX definido)
> Documento para backend. Aquí van endpoints nuevos/cambios requeridos por el UX reciente (PDF catálogo + QR placement, efectos Premium, calendario/recordatorios, modo recuerdo post-evento, etc.).

---

## 1) Cambios de alcance que impactan API

### 1.1 Plantillas PDF (catálogo + upload planner + QR placement)
**Nuevo:** catálogo de plantillas PDF por categoría (tipo de evento) y flujo para que el planner:
- elija una plantilla del catálogo **o** suba su PDF,
- defina coordenadas del recuadro QR sobre el PDF (drag & drop),
- guarde esa “configuración de plantilla” por evento.

**Recomendación técnica (backend)**
- Almacenar PDFs en storage (S3/R2) + thumbnails (png/jpg) por plantilla.
- Guardar placement en coordenadas **normalizadas** (0..1) para estabilidad en distintos tamaños:
  - `page_index`, `x`, `y`, `w`, `h`, `rotation`

---

## 2) Endpoints nuevos / cambios propuestos (OpenAPI v1.1)

### 2.1 Templates PDF (catálogo)
- `GET /templates/pdf?category={category}`
  - Response: lista de `{templateId, name, category, thumbUrl, pdfUrl, isSystemTemplate}`

- `POST /templates/pdf/upload`
  - Auth: Planner
  - Body: multipart `file` (PDF)
  - Response: `{templateId, pdfUrl, thumbUrl}`

### 2.2 Asignación de plantilla PDF a un evento
- `POST /events/{eventId}/pdf-template/select`
  - Body: `{templateId}`
  - Response: `{eventId, templateId}`

- `POST /events/{eventId}/pdf-template/upload`
  - Body: multipart `file` (PDF)
  - Response: `{eventId, templateId}`

### 2.3 QR placement para PDF
- `PATCH /events/{eventId}/pdf-template/qr-placement`
  - Body:
    ```json
    {
      "page_index": 0,
      "x": 0.72,
      "y": 0.81,
      "w": 0.18,
      "h": 0.18,
      "rotation": 0
    }
    ```
  - Response: `{ok: true}`

**Validaciones**
- placement dentro de límites (0..1)
- w/h mínimos (ej. >= 0.05)
- rotation ∈ {0,90,180,270}

### 2.4 Exportaciones (CSV/Excel)
- `GET /exports/guests/{eventId}?format=csv|xlsx`
- `GET /exports/rsvp/{eventId}?format=csv|xlsx`
- `GET /exports/attendance/{eventId}?format=csv|xlsx`

**Notas**
- `format` es opcional; default `csv`.
- Content-Type:
  - `text/csv`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Layout de columnas documentado en `EXPORT_FORMATOS_MONOTICKETS.md`.

---

## 3) Premium config: efecto Flipbook / Pergamino + secciones (bloques)
**Nuevo:** guardar un “layout controlado” con secciones activables, contenido editable, colores y efecto.

### 3.1 Endpoints Premium
- `GET /events/{eventId}/premium-config`
- `PATCH /events/{eventId}/premium-config`

**Modelo recomendado**
```json
{
  "effect": "FLIPBOOK|SCROLL",
  "colors": {
    "primary": "#...",
    "secondary": "#...",
    "accent": "#...",
    "background": "#..."
  },
  "sections": {
    "cover": { "title": "...", "subtitle": "...", "coverImageId": "..." },
    "story": { "enabled": true, "text": "...", "imageIds": ["..."] },
    "gallery": { "enabled": true, "imageIds": ["..."] },
    "location": { "enabled": true, "placeText": "...", "mapUrl": "..." },
    "extras": [
      { "enabled": true, "title": "Mesa de regalos", "text": "...", "linkUrl": "..." }
    ],
    "rsvp": { "ctaText": "Confirmar asistencia", "helperText": "..." }
  },
  "a11y": {
    "reduceMotionDefault": false
  }
}
```

**Restricciones**
- gallery: max 5 imágenes; 2MB c/u (validar en upload)
- extras: max 2 bloques
- contrast: idealmente validar WCAG AA (mínimo advertir/flag)

---

## 4) Invitado: agregar al calendario + recordatorios (ICS)
**Nuevo:** botón “Agregar al calendario” con selección de recordatorios:
- 3 días antes
- 1 semana antes
- 15 días antes
- 1 mes antes
(multi-select)

### 4.1 Endpoints públicos
- `POST /public/invite/{token}/calendar/ics`
  - Body:
    ```json
    { "reminders": ["P3D","P7D","P15D","P1M"] }
    ```
  - Response: `text/calendar` (archivo `.ics`)
  - Incluye evento y alarmas (VALARM) por reminder seleccionado.

**Nota**
- Para Google/Apple/Outlook, `.ics` es la vía más estable y rápida para MVP.

---

## 5) Post-evento “recuerdo” + lector
**Nuevo:** permitir al invitado conservar invitación como recuerdo:
- descarga PDF de recuerdo (para Premium puede ser “render” a PDF o export)
- modo lector sin QR activo (solo lectura)

### 5.1 Endpoints públicos
- `GET /public/invite/{token}/memory`
  - HTML/JSON para render “solo lectura” (QR oculto o inactivo)
- `GET /public/invite/{token}/memory.pdf`
  - PDF de recuerdo

**Reglas**
- Mantener accesible como “recuerdo” aunque el QR no sea válido.
- El acceso “memory” no debe habilitar RSVP ni QR.

---

## 6) Delivery: manual solamente (sin recordatorios automáticos)
**Confirmación UX:** envío masivo manual desde panel planner.

- `POST /events/{eventId}/deliveries/send`
- `POST /invitations/{invitationId}/deliveries/resend`

**Reintentos automáticos (backend)**
- 3 intentos por canal antes de FAILED (como SRS).
- Registrar `invite_received_at` al primer `SENT` real (SMS o WhatsApp).

---

## 7) Scanner: entrada parcial con lista de nombres (solo nombres)
**Confirmación UX:** para guestCount>1 staff marca quién entra.

- `POST /scanner/validate`
  - Response debe incluir:
    - `guestCount`, `remainingCount`
    - `guestNames[]` (solo nombres)
    - `notes` (si aplica)
    - status

- `POST /scanner/entry/confirm`
  - Body:
    ```json
    { "invitationId": "...", "enteredNames": ["Juan", "Ana"] }
    ```
  - Response:
    - remainingCount actualizado
    - status FULLY_USED/PARTIALLY_USED

---

## 8) Stats/Métricas: resumen para dashboard amigable
**Nuevo o asegurar:** endpoint que entregue KPIs listos para UI en cards:

- `GET /events/{eventId}/stats`
- `GET /events/{eventId}/metrics`

**Recomendación**
Incluir:
- counts: totalInvitations, delivered, failed, confirmed, declined, scanned
- rates: deliveryRate, rsvpRate, showUpRate
- timeToRsvpAvgDays

---

## 9) Director Global (alertas delivery)
**Confirmado:** alerta si `delivery_failed_rate > 10%` en un evento.

- `GET /director/alerts`
- `GET /director/planners`
- `PATCH /director/planners/{plannerId}` (activar/desactivar)
- `PATCH /director/events/{eventId}` (bloquear/desbloquear)

---

## 10) Consideraciones de compatibilidad / OpenAPI
- Añadir schemas:
  - `PdfTemplate`, `PdfQrPlacement`, `PremiumConfig`, `IcsRemindersRequest`, `MemoryView`
- Añadir tags:
  - Templates, Premium, Calendar, Memory
- Añadir content-types:
  - `text/calendar` para ICS
  - `application/pdf` para PDFs

---

## 11) Backlog explícito (NO MVP)
- CSS custom (estilo libre) → **fuera del MVP**
- Recordatorios automáticos por sistema → **fuera del MVP**
- Editor libre de layout drag-drop para Premium → **fuera del MVP** (solo secciones controladas)
