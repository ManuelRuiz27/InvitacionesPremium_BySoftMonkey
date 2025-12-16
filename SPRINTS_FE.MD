# Monotickets Platinum – Plan de Sprints Frontend

Documento vivo para coordinar la implementación de los pendientes del frontend frente a `FE_requirements_Monotickets_Platinum_v1.1.md`, `SRS_Monotickets_Platinum_v1.2.md` y los contratos expuestos en `BE_updates_OpenAPI_Monotickets_Platinum_v1.1.md`. Debe actualizarse al final de cada sprint (o cuando se cierre una historia relevante) indicando el estado real y los bloqueos detectados.

## Estado actual (resumen rápido)
- La SPA Angular existe (rutas para planner/director/staff/guests), pero casi todos los servicios consumen `MockDataService` y no hay integración real con `monotickets-api`.
- Funcionalidades críticas descritas en FE v1.1 (TemplateCarousel, PDFPreview+QRPlacementOverlay, PremiumEditor, DeliveryPanel completo, Scanner UI con entrada parcial, recordatorios invitados) no están implementadas.
- Hay riesgos de seguridad/configuración: `environment.ts` expone `jwtSecret` y el portal de invitados usa una API key de Maps incrustada.

## Requerimientos faltantes del documento FE v1.1

### Planner (Sección 1 del documento)
1. **Dashboard Planner amigable (1.1)**: cards con KPIs, botón “Nueva invitación”, estados legibles y acciones rápidas vinculadas a `/events/{id}`.
2. **Flujo “Nueva invitación” (1.2)** con bloques A–D:
   - Autosave de campos mínimos vía `POST/PATCH /events`.
   - Elección de tipo de invitación (PDF vs Premium) sin cambiar de pantalla.
   - Acciones para subir CSV, generar link RSVP y link anfitriones.
   - Configuración mínima (`guestCountDefault`, `allowPartialEntry`) y CTA `POST /events/{eventId}/invitations/generate`.
3. **Catálogo PDF + Overlay QR (1.3)**:
   - TemplateCarousel filtrado por tipo.
   - Uploads propios y guardado de coordenadas para QR (`PATCH /pdf-template/qr-placement`).
4. **Resumen del evento (1.4)** como hub operativo con KPIs, acciones rápidas y endpoints `GET /events/{id}/stats`.
5. **Envíos manuales (1.5)** con tabla de estados por canal, acción “Reenviar”.
6. **Gestión de invitados (1.6)**: GuestTable editable inline, filtros, acciones confirm/decline, revoke QR.
7. **Editor Premium (1.7)** con secciones configurables, efectos (Flipbook/Pergamino), toggles `prefers-reduced-motion`, upload multimedia y validaciones WCAG AA.
8. **Métricas del evento (1.8)** y **Configuración del Planner (1.9)** (branding default, plantillas favoritas).

### Invitado (Sección 2)
1. **Landing antes de RSVP (2.1)**: portada, botones confirmar/añadir calendario, configuración de recordatorios múltiples.
2. **Estados posteriores (2.2–2.4)**:
   - Mensaje “Asistencia confirmada”, opción “No podrá asistir” limitada a 20 días.
   - Día del evento con QR activo (“El código estará disponible…”).
   - Post-evento con descarga de recuerdo PDF / vista memoria.

### Staff / Scanner (Sección 3)
1. **Login por token (3.1)** dedicado al rol staff.
2. **Scanner UI (3.2)** con cámara, estados VALID/INVALID/EXPIRADO/REVOCADO/NO CONFIRMADO, lista para entrada parcial y confirmación por nombres, sincronización y modo offline que respete `POST /scanner/validate` y `POST /scanner/entry/confirm`.

### Componentes y UX Copy (Sección 4–5)
- Componentes específicos (EventCard, TemplateCarousel, PDF+Overlay, PremiumEditor, GuestTable, DeliveryPanel, Scanner UI) deben existir como librería compartida.
- Copy obligatorio: “Nada se envía sin tu confirmación”, “Tu invitación ya está lista”, “Puedes personalizar después”, “El código estará disponible el día del evento.”
- Accesibilidad: tipografía mínima 14px mobile, contraste WCAG AA, soporte `prefers-reduced-motion`.
- Empty states y alertas: sin invitados, sin invitaciones generadas, fallos delivery >10%.

## Plan por sprints

### Sprint 1 – Integración base y cimientos del Planner
**Objetivo:** reemplazar datos mock por API real en módulos core y habilitar los flujos Planner 1.1–1.2.

- **Alcance:**
  - Conectar Auth/Planner/Guests/Director services a `monotickets-api` respetando contratos de `BE_updates_OpenAPI`.
  - Implementar Dashboard Planner (cards, KPIs, EventCard reusable) usando endpoints `GET /planners/me`, `/events?owner=me&limit=20`, `/events/{id}/stats`.
  - Reescribir “Nueva invitación” con bloques A–D, autosave y acciones para CSV/Rsvp/Hosts (stub UI + hooks a endpoints reales).
  - Ajustar environment/configs (sin secretos en frontend) y manejo de zonas horarias (`America/Mexico_City`).
  - Definir librería compartida de estados/labels (Listo para enviar, Enviado, Cerrado, Bloqueado).
- **Entregables:**
  - Planner puede crear eventos reales y ver dashboard con datos backend.
  - Documentación de servicios migrados (README + comentarios).
- **Dependencias:** contratos API estables, seeds mínimos en backend, definición de estados legibles.
- **QA/Validación:** pruebas e2e básicas (Cypress o Playwright) para login + creación evento; mocks sólo permitidos en Storybook.

**Estado (15-dic-2025):** En progreso
- [x] Se agregó `environment.useMockData` (DEV on=true / PROD off) y se propagó a Auth, Planner, Guests, Director, Guest público, Scans y Delivery services para que se conecten al backend al desactivar la bandera.
- [x] Se reescribió la pantalla "Nueva invitación" con bloques A-D, autosave (POST/PATCH `/events`), cards para PDF vs Premium y acciones CSV/RSVP/Hosts conectadas a los endpoints definidos.
- [x] Se eliminó `MockDataService`, los servicios ahora consumen los endpoints reales por defecto (planner/director/guests/delivery/scans/guest portal) y se limpió la configuración `useMockData`.
- [x] Dashboard Planner y las vistas de eventos usan estados legibles ("Listo para enviar", "Enviado", etc.) mediante la nueva librería de status chips reutilizable; el Event Detail ya consume `/events/{id}/stats` para mostrar métricas rápidas reales.

**Notas Sprint 1:** Mantener `useMockData=true` sólo mientras se preparan seeds locales; voltearlo a `false` valida instantáneamente contra la API real sin cambios adicionales en los componentes.

### Sprint 2 – Plantillas PDF, generación y gestión de invitados
**Objetivo:** cubrir requerimientos 1.3, 1.5 y 1.6, además de DeliveryPanel funcional.

- **Alcance:**
  - Componentes TemplateCarousel y PDFPreview+QRPlacementOverlay con interacciones drag/resize y guardado normalizado `{page,x,y,w,h,rotation}`.
  - Flujos de selección/Upload y persistencia de coordenadas (`POST /events/{id}/pdf-template/select|upload`, `PATCH /qr-placement`).
  - GuestTable inline edit con filtros, confirm/decline/revoke, importador CSV real (ver layouts definidos en BE doc).
  - DeliveryPanel integrado a `/delivery/send`, `/retry/{invitationId}`, mostrando stats en tiempo real y empty/failure states (>10% fallas -> alerta).
  - Copys obligatorios aplicados en las vistas del Planner.
- **Entregables:** invitaciones PDF generadas con QR posicionado, panel de invitados y deliveries operativos.
- **Dependencias:** endpoints de templates/qr placement disponibles; definición final de layout CSV/XLSX; assets de plantillas.
- **QA:** tests unitarios para overlay (coordenadas), pruebas de subida CSV con archivos válidos/erróneos, flujos manuales QA para delivery/resend.

**Estado (16-dic-2025):** En progreso
- [x] Se creó `TemplateCatalog` (TemplateCarousel) accesible desde el flujo del planner, con filtros por categoría, selección de plantillas PDF y upload de PDFs propios conectados a los endpoints de `plannerService`.
- [x] Se implementó la pantalla `PdfQrPlacement` con preview del PDF y controles para definir `{page,x,y,width,height,rotation}` persistiendo vía `PATCH /events/{id}/pdf-template/qr-placement`.
- [x] GuestTable se conectó a los endpoints de confirmación/declinación manual y revocación/reenvío de invitaciones; DeliveryPanel ahora consume `GET /delivery/stats|attempts` y maneja envíos/reintentos sin alerts.
- [x] La experiencia de `PdfQrPlacement` ahora usa pdf.js para renderizar el PDF real, incluye navegación por páginas, overlay arrastrable con asas de resize, sliders/inputs sincronizados y mensajes de ayuda alineados al copy oficial.
- [x] DeliveryPanel se actualiza en tiempo real (auto-refresh cada 15s), muestra métricas por canal e historial reciente y despliega alertas cuando el ratio de fallas supera 10%, además de empty states y manejo de reintentos individuales mejorado.
- [x] GuestTable incluye edición inline de nombre, cupo y notas rápidas con validaciones y feedback inmediato, cubriendo el pendiente 1.6 de "gestión rápida" sin abandonar la vista.
- [x] El módulo de invitados ahora muestra KPIs live del evento (confirmados, pendientes, declinados, escaneos) y se recalcula tras confirmar/declinar, además de soportar selección múltiple para confirmar/declinar/reenviar/revocar en lote.
- [x] Se habilitó el selector de efecto Flipbook/Pergamino, el toggle “Reducir animaciones” y la validación automática de contraste AA en el Premium Editor, cumpliendo la historia S3-H2.

### Sprint 3 – Premium Editor y experiencia del invitado
**Objetivo:** cubrir requerimientos 1.7, 2.1–2.4 y parte de 4–5 (copy/accesibilidad).

- **Alcance:**
  - Construir PremiumEditor modular (portada, historia, galería, ubicación, info adicional, RSVP, acceso). Live preview mobile + toggles.
  - Selector de “Efecto” Flipbook/Pergamino, toggle “Reducir animaciones” respaldado por `prefers-reduced-motion`.
  - Paletas de color predefinidas por tipo de evento, validación contraste WCAG AA.
  - Renovar landing invitado: portada, CTA confirmar, configurador de recordatorios (3d/1sem/15d/1m) antes de descargar ICS, copy “Nada se envía…”.
  - Flujo post-RSVP (confirmar/declinar en 20 días), mensaje “El código estará disponible el día del evento” y QR habilitado sólo al llegar la fecha (`GET /public/invite/{token}/access`).
  - Vista “Recuerdo” post-evento con descarga PDF y lector de memoria.
- **Entregables:** editores premium guardando `PATCH /events/{id}/premium-config`, portal invitado completo y accesible.
- **Dependencias:** endpoints de media upload y premium config; definición UX final en Figma; assets (animaciones, iconos).
- **QA:** Lighthouse + axe para accesibilidad, pruebas responsive, validación ICS (recordatorios correctos).

#### Historias Sprint 3 (preparación 16-dic-2025)
- [x] **S3-H1 | Premium Editor - Estructura base:** layout de secciones (portada, historia, galería, ubicación, info extra, RSVP, acceso) con preview mobile y persistencia `PATCH /events/{eventId}/premium-config`.
- [x] **S3-H2 | Efectos + accesibilidad:** selector Flipbook/Pergamino, toggle “Reducir animaciones”, validación automática de contraste AA.
- [x] **S3-H3 | Landing invitado previa al RSVP:** portada premium conectada a `premiumConfig`, copy “Nada se envía sin tu confirmación”, CTA confirmar y configurador de recordatorios 3d/1sem/15d/1m antes de descargar el .ics.
- [x] **S3-H4 | Flujo post-RSVP y día del evento:** mensajes “Asistencia confirmada/No podré asistir”, bloqueo de QR hasta el día del evento y copy “El código estará disponible...”.
- [x] **S3-H5 | Recuerdo post-evento:** vista solo lectura + descarga PDF reutilizando los assets del editor premium.

**Notas Sprint 3 (16-dic-2025):**
- La landing premium ya consume `premiumConfig` (cover, paleta y secciones) e integra el selector de recordatorios 3d/1sem/15d/1m antes de generar el archivo .ics.
- Se agregA3 el banner post-RSVP/QR en la landing (mensajes confirmada/declinada, bloqueo QR hasta el dA-a del evento y acciA3n "No podrA(c) asistir" limitada a 20 dA-as).
- Modo recuerdo habilitado post-evento con botones Ver invitacion/Descargar recuerdo (S3-H5 cerrado).

### Sprint 4 – Métricas, configuración planner y Scanner UI
**Objetivo:** cerrar secciones 1.4, 1.8, 1.9, 3.1–3.2 y pendientes de componentes reutilizables/empty states.

- **Alcance:**
  - Event summary hub con KPIs live (`GET /events/{id}/stats`, `/invitations?limit=...`) y acciones rápidas (enviar, ver invitados, editar, métricas, exportar).
  - Pantalla de métricas (delivery success, RSVP rate, show-up rate, time-to-RSVP, alertas).
  - Configuración del planner (branding por defecto, preferencias, datos de contacto).
  - Scanner UI completa: login por token, cámara con estados detallados, entrada parcial por lista de nombres, `POST /scanner/validate` y `/scanner/entry/confirm`, modo offline con cola y sincronización, historial.
  - Empty states/alertas de UX pendientes (sin invitados, sin invitaciones, fallos >10%) y consolidación de los componentes compartidos en `/shared`.
- **Entregables:** panel operativo listo para directores/planners, scanner funcional en campo, documentación UX copy aplicada.
- **Dependencias:** API de métricas y configuración del planner; definición final de estados scanner y payload de entrada parcial; QA en dispositivos con cámara.
- **QA:** pruebas manuales en dispositivos móviles para scanner, métricas verificadas contra backend, tests e2e exportaciones.

**Estado (17-dic-2025):** En progreso
- [x] "EventMetrics" (S4-H1) disponible desde el resumen del evento: consume "GET /metrics/events/{eventId}" + "/events/{eventId}/stats", muestra delivery/rsvp/show-up rate, tiempo promedio de RSVP, alertas proactivas y comparativa de accesos vs confirmados.
- [x] "PlannerSettings" (S4-H2) con formulario reactivo para branding/contacto/preferencias, guardado contra "GET/PATCH /planners/me/settings" y accesible desde el dashboard como acci�n r�pida.
- [ ] Scanner UI completa (login por token, entrada parcial, sincronizaci�n offline) - pendiente de amarrar "ScannerService" al UI y exponer los nuevos estados VALID/PARTIAL/DECLINED.
- [ ] QA responsive/accesibilidad de la landing premium y del hub del planner (ventana "No podr� asistir" + modo recuerdo) � programado tras liberar Scanner.

**Notas Sprint 4:** Tras publicar m�tricas y settings el siguiente bloque cr�tico es Scanner (SRS 3.1-3.2); reutilizar "ScannerService" contra "/scanner/validate" y "/scanner/entry/confirm", luego ejecutar QA responsive/accesible y documentar hallazgos en GAP Report.


### Post Sprint 4 / Hardening
- Auditoría de seguridad (API keys, tokens), configuración de service worker/PWA si aplica, pruebas de carga para delivery y landing.
- Preparar Storybook o documentación de componentes reutilizables (EventCard, TemplateCarousel, etc.).

## Seguimiento y actualizaciones
1. **Al final de cada sprint:** actualizar este archivo con el estado (“COMPLETADO / EN PROGRESO / BLOQUEADO”) por sprint y anotar bloqueos o ajustes de alcance.
2. **Nuevos hallazgos:** agregar subsección “Delta Sprint X” con decisiones de producto o cambios de contrato.
3. **Sincronización con GAP Report:** marcar cuando cada requerimiento FE esté cubierto para poder cerrar los ítems correspondientes en `GAP_REPORT_SRS_vs_IMPLEMENTACION.md`.

> Nota: cualquier cambio en las dependencias backend debe reflejarse aquí y en `BE_updates_OpenAPI_Monotickets_Platinum_v1.1.md` para mantener trazabilidad bidireccional.
