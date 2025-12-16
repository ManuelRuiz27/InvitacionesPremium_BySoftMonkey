# SRS – Monotickets Platinum v1.1
## Sistema de Invitaciones Digitales para Eventos Privados

---

## 1. Introducción

### 1.1 Propósito
Este documento define de manera formal, completa y verificable los requerimientos funcionales y no funcionales del sistema **Monotickets Platinum**, una plataforma orientada a la generación, distribución y control de invitaciones digitales para **eventos sociales privados**, garantizando simplicidad operativa para el organizador y control de acceso confiable durante el evento.

El documento está dirigido a:
- Equipo de desarrollo
- QA / Testing
- Dirección del proyecto
- Stakeholders técnicos

---

### 1.2 Alcance del Sistema
Monotickets Platinum permite a organizadores de eventos privados (planners) crear eventos, generar invitaciones digitales con QR dinámico, distribuirlas vía SMS y WhatsApp, gestionar confirmaciones (RSVP) y controlar accesos mediante escaneo en sitio.

**Fuera del alcance del MVP:**
- Modelos de negocio
- Pasarelas de pago
- Eventos públicos
- Venta de boletos

---

### 1.3 Definiciones, Acrónimos y Abreviaturas

| Término | Definición |
|-------|-----------|
| Planner | Usuario organizador del evento |
| Director Global | Usuario con control total del ecosistema |
| Staff | Usuario que escanea QR en el evento |
| Invitado | Persona que recibe la invitación |
| RSVP | Confirmación de asistencia |
| QR dinámico | Código QR firmado con JWT y validaciones temporales |
| guestCount | Número de personas incluidas en una invitación (1–10) |
| CDMX | Zona horaria oficial del sistema |

---

### 1.4 Referencias
- WCAG 2.1 AA
- JWT RFC 7519
- RESTful API Design
- OWASP Top 10

---

### 1.5 Panorama General del Documento
Este documento describe:
- Visión general del producto
- Tipos de usuarios
- Requerimientos funcionales
- Requerimientos no funcionales
- Interfaces externas
- Reglas de negocio
- KPIs del MVP
- Máquinas de estados

---

## 2. Descripción General

### 2.1 Perspectiva del Producto
Monotickets Platinum es un sistema independiente tipo SaaS, diseñado como **solución**, no como carga operativa adicional.  
Todas las historias de usuario están limitadas a **menos de 4 acciones** por flujo principal.

---

### 2.2 Funciones del Producto
- Creación de eventos privados
- Plantillas PDF y Premium (landing)
- Gestión de invitados (CSV, RSVP, Host Link)
- Envío de invitaciones (SMS + WhatsApp)
- Confirmación de asistencia (RSVP)
- QR dinámico con control grupal (guestCount 1–10) y entrada parcial
- Escaneo y control de acceso
- Métricas por evento y globales (Director Global)
- Exportación de reportes (CSV/Excel)
- Galería de fotos para plantilla Premium (máx 5, 2MB c/u)

---

### 2.3 Características de los Usuarios

| Rol | Características |
|---|---|
| Planner | Wedding planners, organizadores de XV años, graduaciones |
| Staff | Personal de acceso con dispositivos móviles, uso de cámara |
| Invitado | Usuario no técnico, mobile-first, recibe link por SMS/WhatsApp |
| Director Global | Usuario administrativo del ecosistema; métricas y control global |

---

### 2.4 Restricciones Generales
- Idioma: Español (México)
- Zona horaria única: CDMX (`America/Mexico_City`)
- Máx. 5 eventos simultáneos (capacidad objetivo MVP)
- Máx. 1000 invitados por evento
- Máx. 1000 invitaciones por evento
- guestCount por invitación: 1–10
- QR válido solo el día calendario del evento (00:00–23:59 CDMX)
- Landing Premium con peso objetivo ≤ 3 MB

---

### 2.5 Suposiciones y Dependencias
- Invitados con smartphone y navegador moderno.
- Staff con cámara funcional y permisos de cámara.
- Conectividad móvil durante el evento (mínima para validar QR).
- Integración con proveedores externos:
  - Proveedor SMS
  - WhatsApp Cloud API

---

## 3. Requerimientos Específicos

---

## 3.1 Requerimientos Funcionales

### 3.1.1 Historias de Usuario (Resumen)
> Nota de diseño: cada historia debe poder completarse con **≤ 4 acciones** del usuario principal (Planner/Staff).

**Planner**
- Crear evento (DRAFT)
- Seleccionar tipo de plantilla (PDF o Premium) y configurarla
- Publicar evento (PUBLISHED)
- Cargar invitados (CSV/Excel)
- Generar invitaciones (QR/landing)
- Enviar invitaciones (SMS + WhatsApp)
- Editar datos de invitado (incluido teléfono) después de generar invitación
- Confirmar manualmente invitados (RSVP)
- Rescindir/invalidar invitación y QR
- Ver métricas del evento
- Exportar lista de invitados (CSV/Excel)
- Solicitar borrado total del evento antes de 12 meses

**Invitado**
- Abrir invitación (landing o PDF)
- Confirmar asistencia (RSVP)
- Revocar confirmación a DECLINED dentro de 20 días desde recepción de invitación

**Staff**
- Login por token
- Escanear QR
- Para QR grupal: ver lista de nombres y marcar quién entra
- Confirmar entrada parcial o total

**Director Global**
- Crear y desactivar planners
- Bloquear/desbloquear eventos
- Ver métricas globales y por planner
- Recibir alertas por fallos de delivery (>10%)

---

### 3.1.2 Requerimientos Detallados de Funciones (Reglas Críticas)

#### 3.1.2.1 Estados y transiciones (alto nivel)
**Evento**: `DRAFT → PUBLISHED → CLOSED` y `BLOCKED` (control Director)  
**Invitado RSVP**: `PENDING ↔ CONFIRMED ↔ DECLINED`  
**Invitación**: `CREATED → AWAITING_RSVP → ACTIVE_FOR_EVENT_DAY → PARTIALLY_USED → FULLY_USED` y `REVOKED`  
**QR**: `INACTIVE → ACTIVE → EXPIRED` y `REVOKED`

> La máquina de estados completa es obligatoria para QA y backend y debe alinearse a las reglas temporales y de roles aquí especificadas.

---

#### 3.1.2.2 Eventos
- **Publicación (PUBLISHED)**: solo el Planner puede publicar.
- **Cierre (CLOSED)**: automático **72 horas después de la hora del evento** (CDMX).  
  Ejemplo: evento 2026-01-10 19:00 → cierre automático 2026-01-13 19:00 (CDMX).
- **Bloqueo (BLOCKED)**: el Director Global puede bloquear/desbloquear un evento.
  - Evento BLOCKED no permite envío, RSVP ni escaneo.

---

#### 3.1.2.3 Invitados / RSVP
- Planner puede marcar manualmente un invitado como `CONFIRMED` (sin usar landing).
- Invitado puede confirmar (`PENDING → CONFIRMED`) desde la landing.
- Invitado puede revocar confirmación (`CONFIRMED → DECLINED`) **hasta 20 días desde que recibió la invitación**.
  - Definición de “recibió”: `invite_received_at` se setea al primer `SENT` de SMS o WhatsApp.
  - Si `invite_received_at` es NULL (no entregado), no corre ventana.
- El sistema registra timestamps recomendados:
  - `invite_received_at`, `confirmed_at`, `declined_at`.

---

#### 3.1.2.4 Invitaciones y QR dinámico
- guestCount por invitación: **1 a 10**.
- **Validez del QR**:
  - QR válido únicamente en el día calendario del evento en CDMX:
    - inicio: `event.date 00:00:00` CDMX
    - fin: `event.date 23:59:59` CDMX
  - Fuera de ventana: escaneo responde `EXPIRED` aunque el invitado esté confirmado.
- **Entrada parcial permitida**:
  - La invitación inicia con `remaining_count = guestCount`.
  - El staff marca en una lista (solo nombres) quién entró en ese QR.
  - El sistema descuenta `remaining_count` por entradas confirmadas.
  - Cuando `remaining_count = 0`, la invitación queda `FULLY_USED`.
- **Rescindir invitación**:
  - Planner puede invalidar una invitación y su QR en cualquier momento (`REVOKED`).

---

#### 3.1.2.5 Escáner (Staff)
- Staff debe ver únicamente:
  - nombre (display)
  - número de personas (guestCount/remaining_count)
  - notas del invitado
- Resultados de escaneo mínimos:
  - `VALID_FULL`, `VALID_PARTIAL`, `DUPLICATE`, `EXPIRED`, `REVOKED`, `NOT_CONFIRMED`, `EVENT_BLOCKED`, `INVALID`
- Para guestCount > 1, el flujo requiere:
  - mostrar lista de nombres (solo nombres)
  - staff marca cuáles entran
  - confirmar entrada
- El sistema registra cada confirmación como `scan` con:
  - entered_names
  - remaining_count_after
  - staff_id y timestamp

---

#### 3.1.2.6 Delivery (SMS + WhatsApp)
- Envío **siempre doble canal**:
  1) SMS
  2) WhatsApp (siempre, no solo fallback)
- Reintentos automáticos:
  - hasta **3** por canal antes de marcar `FAILED` en ese canal.
- Planner puede forzar reenvío manual aún si estaba `FAILED`.
- Si el teléfono es inválido o falla permanentemente:
  - estado “inválido”
  - el sistema sugiere alternativas:
    - “Imprimir lista/QR”
    - “Generar QR/Link para compartir por cualquier canal”
- Si el planner actualiza teléfono:
  - si el invitado ya estaba confirmado, **no** es necesario re-trigger delivery por regla de negocio del MVP.

---

#### 3.1.2.7 Alertas (Director Global)
- Si en un evento, el porcentaje de invitaciones en estado `DELIVERY_FAILED` supera **10%**:
  - se genera una alerta visible en el panel del Director Global.
- Canal: notificación interna en panel.
- No se requiere auditoría textual detallada de acciones (por decisión del MVP).

---

#### 3.1.2.8 Retención y privacidad
- A los **12 meses**, el sistema debe:
  - **anonimizar** datos personales (nombre/teléfono) manteniendo métricas agregadas.
- Planner puede solicitar borrado total del evento (y toda su data) antes del periodo.

---

## 3.2 Requerimientos No Funcionales

### 3.2.1 Rendimiento
- **Landing Premium**:
  - Tiempo promedio de carga en 4G: **≤ 3 s**
  - Peso objetivo total: **≤ 3 MB**
  - Galería: **máximo 5 fotos**, **máx 2MB** cada una.
- Escaneo:
  - Respuesta de validación objetivo: ≤ 2 s (meta recomendada para UX en puerta).

---

### 3.2.2 Seguridad
- QR dinámico basado en JWT firmado.
- Validación server-side de firma y claims por escaneo.
- Control de acceso por rol en endpoints.
- Rate limiting recomendado en:
  - `/scanner/validate`
- Protección básica contra abuso:
  - tokens con expiración acorde a “día del evento”
  - invalidación inmediata si invitación revocada
- OWASP Top 10 como referencia de hardening.

---

### 3.2.3 Usabilidad
- Mobile-first en landing y scanner.
- Flujos principales limitados a ≤ 4 acciones por historia.
- Feedback inmediato para el staff (valid/invalid/expired, etc.).

---

### 3.2.4 Confiabilidad
- Disponibilidad documentada: **99.0% mensual**.
- Registro persistente de escaneos y actualizaciones de remaining_count.

---

### 3.2.5 Mantenibilidad
- Arquitectura modular por dominios:
  - auth, planners, events, guests, invitations, delivery, scanner, director, exports
- Contratos OpenAPI como fuente de verdad.

---

### 3.2.6 Portabilidad
- Web responsive.
- Compatible con navegadores modernos (Chrome/Safari/Edge actuales).

---

### 3.2.7 Escalabilidad
- Objetivo MVP:
  - **5 eventos simultáneos**
  - **hasta 1000 invitados por evento**
- El sistema debe evitar degradación perceptible en listados y escaneo en puerta.

---

## 3.3 Requerimientos de Interfaz Externa

### 3.3.1 Interfaces de Usuario
- **Panel Planner**
  - CRUD eventos
  - configuración plantillas
  - carga invitados
  - envío
  - métricas por evento
  - export CSV/Excel
- **Panel Director Global**
  - gestión planners
  - bloqueo eventos
  - métricas globales y por planner
  - alertas
- **Scanner Staff**
  - login por token
  - cámara y validación
  - selección de nombres para entrada parcial
- **Landing Invitado (Premium/PDF)**
  - vista invitación
  - RSVP
  - contenido premium (galería, mapas, secciones, etc.)

---

### 3.3.2 Interfaces de Hardware
- Cámara del dispositivo móvil (staff) para lectura QR.

---

### 3.3.3 Interfaces de Software
- Proveedor SMS (API)
- WhatsApp Cloud API
- Base de datos relacional
- Servicio de almacenamiento para assets (imágenes/plantillas)

---

### 3.3.4 Interfaces de Comunicación
- HTTPS obligatorio
- REST JSON
- JWT
- Webhooks opcionales para delivery (según proveedor), si aplica

---

## 3.4 Otros Requerimientos

### 3.4.1 Requerimientos Legales y Regulatorios
- Retención y anonimización a 12 meses (PII)
- Borrado total bajo solicitud del planner
- Buenas prácticas de privacidad (mínimo de datos en Staff UI)

---

### 3.4.2 Requerimientos de Datos
- Exportación CSV/Excel de:
  - invitados
  - RSVP
  - asistencia (escaneos/entradas parciales)
- Métricas mínimas:
  - invitaciones generadas (QR generados)
  - % delivery
  - % RSVP
  - show-up rate

---

## 4. KPIs del MVP (Oficiales)

| KPI | Definición | Umbral |
|---|---|---|
| Delivery Success Rate | % invitaciones entregadas (al menos 1 canal en SENT) / invitaciones generadas | **≥ 95%** |
| RSVP Rate | % confirmados / invitaciones entregadas | **≥ 65%** |
| Show-up Rate | % escaneados válidos / confirmados | **≥ 90%** |
| Carga Landing Premium | Tiempo promedio en 4G | **≤ 3 s** |
| Peso Landing Premium | Peso total objetivo | **≤ 3 MB** |
| Time-to-RSVP | Tiempo típico esperado para confirmar | **≤ 7 días** |

---

## 5. Estado del Documento
- Versión: **1.1**
- Estado: **Aprobado para desarrollo**
- Ambigüedad residual: **Nula**
- Idioma: **Español (México)**
- Zona horaria: **CDMX**
