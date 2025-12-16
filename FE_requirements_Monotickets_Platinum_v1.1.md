# Monotickets Platinum v1.1 — Requerimientos Frontend (Planner + Invitado + Staff)
> Documento para diseño UI/UX + implementación Frontend.  
> Objetivo: **flujo rápido**, “somos solución”, y pantallas claras con **≤ 4 acciones** por tarea principal.

---

## 0) Convenciones generales

### 0.1 Idioma y zona horaria
- Idioma: **Español (México)**
- Zona horaria: **CDMX** (`America/Mexico_City`) para todo lo que se muestre.

### 0.2 Principios UX
- El Planner no “configura”; el Planner “termina una invitación”.
- **Sin estados técnicos** (NO mostrar DRAFT/PUBLISHED). Usar:
  - “Listo para enviar”
  - “Enviado”
  - “Cerrado”
  - “Bloqueado”
- Autosave donde aplique. Sin botones de “Guardar” salvo acciones críticas (ej. invalidar).
- Modales simples para acciones destructivas (revocar, cerrar/bloquear).

### 0.3 Componentes reutilizables
- **EventCard**: resumen de evento + KPIs
- **TemplateCarousel**: catálogo por tipo de evento
- **PDFPreview + QRPlacementOverlay**: vista PDF + recuadro arrastrable de QR
- **PremiumEditor**: editor por secciones con toggles + live preview mobile
- **GuestTable**: listado con edición inline
- **DeliveryPanel**: envío manual + estados por canal
- **ScannerUI**: validación QR + entrada parcial por lista de nombres

---

## 1) Pantallas Planner

### 1.1 Dashboard Planner (lista amigable)
**Objetivo:** ver 1–4 eventos y actuar rápido.

**UI (mínimo):**
- Botón primario: **➕ Nueva invitación**
- Lista de eventos (cards/tabla):
  - Nombre
  - Fecha/Hora
  - Estado legible
  - KPIs mini: Invitaciones, Confirmados, Declinados, Escaneados
  - Acción: **Ver evento**

**IO**
- **Entrada:** `plannerId` desde sesión.
- **Salida:** lista de eventos con KPIs.

**Endpoints**
- `GET /planners/me`
- `GET /events?owner=me&limit=20`
- `GET /events/{eventId}/stats` *(o stats embebidos en /events)*

---

### 1.2 Nueva invitación (pantalla crítica, 1 flujo)
**Objetivo:** capturar datos clave y generar invitaciones sin fricción.

#### Bloque A: Datos del evento (sin scroll)
Campos:
- Nombre del evento
- Tipo de evento (cards): **Boda, XV Años, Graduación, Cumpleaños, Bautizo, Aniversario, Corporativo, Antro/Acceso, Otro**
- Fecha
- Hora
- Lugar (texto)

**Comportamiento**
- Autosave: al completar mínimos, crear evento en background.
- No pedir más.

**Endpoints**
- `POST /events` (crear en “borrador invisible”)
- `PATCH /events/{eventId}` (autosave)

#### Bloque B: Tipo de invitación (decisión estética)
Cards:
- **Estándar PDF**
- **Premium (Landing)**

**Comportamiento**
- Selección solo define “modo”. No navega a otra pantalla.

**Endpoints**
- `PATCH /events/{eventId}` con `inviteMode=PDF|PREMIUM`

#### Bloque C: Invitados
Acciones visibles (ninguna obligatoria en ese momento):
1) **Subir lista (CSV/Excel)**  
2) **Generar link de formulario RSVP (invitados se registran solos)**  
3) **Generar link de anfitriones** (opcional)

**Endpoints**
- `POST /events/{eventId}/guests/import` (CSV/Excel)
- `POST /events/{eventId}/forms/rsvp` → retorna `public_url`
- `POST /events/{eventId}/forms/hosts` → retorna `public_url`

#### Bloque D: Config mínima
- Personas por invitación (1–10) `guestCountDefault`
- Checkbox: “Permitir entrada parcial” `allowPartialEntry`

**Endpoints**
- `PATCH /events/{eventId}` (guardar defaults)

#### CTA
- Botón grande: **🚀 Generar invitaciones**
- Texto: “Puedes hacer cambios después. Nada se envía sin tu confirmación.”

**Endpoints**
- `POST /events/{eventId}/invitations/generate`

---

### 1.3 Selección y personalización — Estándar PDF (nuevo flujo)
> Este flujo aplica cuando el planner eligió **Estándar PDF**.

#### Pantalla: “Plantillas PDF”
**Objetivo:** elegir plantilla precargada o subir PDF propio.

**UI**
- Tabs o filtros por tipo de evento (Boda, XV, etc.)
- **Carrusel / grid** de 8–10 plantillas por categoría (thumbnail + nombre)
- Botón: **Subir mi invitación (PDF)**

**Endpoints**
- `GET /templates/pdf?category={category}` *(catálogo)*
- `POST /templates/pdf/upload` *(pdf del planner)*

#### Pantalla: “Colocar QR en PDF”
**Objetivo:** el planner define el recuadro exacto donde va el QR.

**UI**
- Vista previa PDF (página seleccionable si es multi-página)
- Overlay “QR box” arrastrable:
  - mover (x,y)
  - resize (w,h)
  - rotación 0/90/180/270 (opcional)
- Controles:
  - Página destino (default: 1)
  - Botón: **Guardar área de QR**
  - Botón: **Usar esta plantilla**

**IO**
- Entrada: coords del recuadro: `{page, x, y, w, h, rotation}` (unidades normalizadas 0..1 o px según backend defina; preferible normalizado)
- Salida: plantilla lista.

**Endpoints**
- `POST /events/{eventId}/pdf-template/select` *(si eligió plantilla del catálogo)*
- `POST /events/{eventId}/pdf-template/upload` *(si subió PDF)*
- `PATCH /events/{eventId}/pdf-template/qr-placement` *(coords)*

---

### 1.4 Resumen del evento (hub)
**Objetivo:** operar el evento.

**UI**
- Header: nombre/fecha/lugar + estado legible
- Cards KPI:
  - Invitaciones generadas
  - Confirmados
  - Pendientes
  - Declinados
  - Escaneados
- Acciones rápidas:
  - ✉️ Enviar invitaciones
  - 👥 Ver invitados
  - 🎨 Editar invitación
  - 📊 Ver métricas
  - 📤 Exportar lista (selector CSV/Excel)

**Exportar lista**
- Mostrar modal simple con selector `Formato: CSV | Excel` (preseleccionado CSV) y nota “ver columnas en Export Formats”.
- Invocar `GET /exports/guests/:eventId?format=csv|xlsx` (misma UX aplica para RSVP y asistencia desde las secciones correspondientes).
- Descargar archivo conservando nombre `guests-{nombre_evento}.{csv|xlsx}`.

**Endpoints**
- `GET /events/{eventId}`
- `GET /events/{eventId}/stats`
- `GET /events/{eventId}/invitations?limit=...`

---

### 1.5 Envío de invitaciones (manual)
**Objetivo:** enviar cuando el planner quiera. Sin automatizaciones.

**UI**
- Resumen:
  - Listas: Listas para envío / Fallidas / Inválidas
- Botón: **Enviar ahora**
- Tabla por invitación:
  - Nombre invitado
  - Teléfono
  - Estado SMS / Estado WhatsApp
  - Acción: “Reenviar”

**Endpoints**
- `POST /events/{eventId}/deliveries/send` *(envío masivo manual)*
- `POST /invitations/{invitationId}/deliveries/resend`

---

### 1.6 Invitados del evento
**UI**
- Tabla con edición inline:
  - Nombre
  - Teléfono
  - RSVP (PENDIENTE/CONFIRMADO/DECLINADO)
  - guestCount (1–10)
  - Notas
- Acciones por fila:
  - Editar
  - Confirmar manual
  - Rescindir invitación/QR
- Filtros: Todos / Confirmados / Pendientes / Declinados

**Endpoints**
- `GET /events/{eventId}/guests`
- `PATCH /guests/{guestId}`
- `POST /guests/{guestId}/rsvp/confirm` *(manual)*
- `POST /guests/{guestId}/rsvp/decline` *(manual)*
- `POST /invitations/{invitationId}/revoke`

---

### 1.7 Editor Premium (Landing) — con “efecto” (Flipbook o Pergamino)
> El planner puede personalizar **cuando quiera**, pero no es obligatorio.

#### Pantalla: “Editar invitación Premium”
**UI**
- Preview mobile en vivo
- Panel por secciones (colapsables):
  1) Portada (título/subtítulo/imagen)
  2) Historia (texto + 0–2 fotos pequeñas) *(opcional)*
  3) Galería (máx 5 fotos, 2MB c/u) *(toggle)*
  4) Ubicación / Mapa *(toggle)*
  5) Información adicional (2 bloques máx: mesa de regalos, dress code, agenda, etc.) *(opcional)*
  6) RSVP (texto editable, botón fijo)
  7) Acceso (QR): placeholder hasta el día del evento

#### Selección de “Efecto”
- Selector (radio):
  - **Libro (Flipbook)**
  - **Pergamino**
- Respeta `prefers-reduced-motion` y ofrecer toggle “Reducir animaciones”.

#### Colores (personalización sencilla)
- Paletas predefinidas por tipo de evento + custom:
  - Color principal
  - Color secundario
  - Color de acento
  - (opcional) fondo
- Validación: contraste mínimo **WCAG AA**.

**Endpoints**
- `GET /events/{eventId}/premium-config`
- `PATCH /events/{eventId}/premium-config` *(contenido + toggles + colors + effect)*
- `POST /media/upload` *(fotos portada/galería)*

---

### 1.8 Métricas del evento
**UI**
- Delivery success rate
- RSVP rate
- Show-up rate
- Time-to-RSVP promedio
- Alertas (solo lectura)

**Endpoints**
- `GET /events/{eventId}/metrics`

---

### 1.9 Configuración del Planner (defaults)
**UI**
- Branding por defecto:
  - logo
  - colores base
- Preferencias:
  - plantilla favorita (PDF/Premium)
- Datos de contacto (opcional)

**Endpoints**
- `GET /planners/me/settings`
- `PATCH /planners/me/settings`

---

## 2) Pantallas Invitado (Premium + PDF)

### 2.1 Landing (antes RSVP)
**UI**
- Portada + datos clave
- Botón: **Confirmar asistencia**
- Botón: **Agregar al calendario**
- Configurar recordatorios (opcional): 3 días / 1 semana / 15 días / 1 mes (multi-select)

**Endpoints**
- `GET /public/invite/{token}`
- `POST /public/invite/{token}/rsvp/confirm`
- `POST /public/invite/{token}/calendar/ics` *(descarga .ics con recordatorios)*
- `GET /public/invite/{token}/pdf` *(si aplica)*

### 2.2 Después RSVP (confirmado)
**UI**
- Estado: “Asistencia confirmada”
- Acceso: “Tu código estará disponible el día del evento”
- Botón: **Agregar al calendario** (si no lo hizo)
- Botón: **No podré asistir** (si dentro de 20 días desde recibido)

**Endpoints**
- `POST /public/invite/{token}/rsvp/decline`

### 2.3 Día del evento (QR activo)
**UI**
- Banner “Acceso habilitado”
- QR grande
- Texto: “Invitación válida para hasta X personas”
- (No mostrar remaining_count; eso lo gestiona Staff)

**Endpoint**
- `GET /public/invite/{token}/access` *(retorna estado + QR payload para render)*

### 2.4 Post-evento (recuerdo)
**UI**
- Botón: **Descargar recuerdo (PDF)**
- Botón: **Ver invitación (modo recuerdo)** *(lector)*

**Endpoints**
- `GET /public/invite/{token}/memory` *(vista lectura)*
- `GET /public/invite/{token}/memory.pdf` *(export/recuerdo)*

---

## 3) Pantallas Staff (Scanner)

### 3.1 Login por token
**UI**
- Input token
- Botón “Entrar”

**Endpoints**
- `POST /staff/login` *(token → JWT staff)*

### 3.2 Escaneo
**UI**
- Cámara
- Resultado grande:
  - Válido / Inválido / Expirado / Revocado / No confirmado / Evento bloqueado
- Para invitación grupal:
  - Lista de nombres (solo nombres)
  - Staff marca quién entra
  - Botón: Confirmar entrada (descuenta remaining)

**Endpoints**
- `POST /scanner/validate` *(payload QR)*
- `POST /scanner/entry/confirm` *(selectedNames, invitationId)*

---

## 4) UX Copy (frases obligatorias)
- “Nada se envía sin tu confirmación.”
- “Tu invitación ya está lista.”
- “Puedes personalizar después (opcional).”
- “El código estará disponible el día del evento.”

---

## 5) Lista de pendientes para diseño (Figma)
- Componentes: EventCard, TemplateCarousel, PDF+Overlay, PremiumEditor, GuestTable, DeliveryPanel, Scanner UI
- Estados visuales y empty states:
  - Sin invitados
  - Sin invitaciones generadas
  - Fallos de delivery > 10% (alerta Director, pero Planner puede ver “hay fallos”)
- Accesibilidad:
  - 14px mínimo mobile
  - WCAG AA contraste
  - prefers-reduced-motion
