# Plan de trabajo por sprints para actualizar, cubrir y completar el SRS
**Proyecto:** Monotickets Platinum (Sistema de Invitaciones Digitales para Eventos Privados)  
**Documento base:** `SRS_Monotickets_Platinum_v1.1.md`  
**Objetivo:** Llevar el SRS a una versión **v1.2** consistente, verificable y trazable (listo para QA, desarrollo y operación), alineado con la implementación real y/o decisiones de producto.

---

## 1) Hallazgos principales (SRS v1.1)
### 1.1 Calidad del documento
- **Codificación/símbolos dañados**: aparecen caracteres corruptos en encabezados y métricas (p. ej. “IntroducciA3n”, “ƒ%”, flechas).
- **Requerimientos sin IDs**: falta identificación trazable por requisito (RF/RNF/INT/DATA/LEGAL).
- **Criterios de aceptación insuficientes**: muchas reglas no son “testables” tal cual están redactadas.
- **Estados/flujo incompletos**: el SRS exige “máquina de estados completa”, pero solo lista estados a alto nivel.

### 1.2 Huecos de especificación (para completar)
- **Contratos API** (OpenAPI): endpoints, auth, paginación, errores, códigos, ejemplos.
- **Modelo de datos**: entidades, campos, constraints, índices, retención/anonimización y eventos de auditoría mínimos.
- **Delivery (SMS+WhatsApp)**: definición de estados por canal, reintentos, webhooks, plantillas, métricas y “delivered” vs “sent”.
- **Scanner/PWA/offline**: requisitos verificables para operación con conectividad variable y sincronización.
- **Import/Export (CSV/Excel)**: formatos, validaciones, ejemplos, errores, y compatibilidad.
- **KPIs**: definición operativa (fórmulas, ventana temporal, fuente de datos y eventos).

### 1.3 Riesgos (si no se corrige)
- QA no puede certificar cumplimiento (sin criterios/IDs).
- Desalineación SRS vs implementación (reglas distintas → bugs y retrabajo).
- Métricas/KPIs inconsistentes (no comparables entre entornos ni a lo largo del tiempo).

---

## 2) Principios de la actualización (SRS v1.2)
### 2.1 Reglas de redacción
- Cada requisito debe ser **único, verificable, no ambiguo y trazable**.
- Separar claramente:
  - **Requerimiento** (qué)
  - **Regla de negocio** (por qué)
  - **Criterio de aceptación** (cómo se prueba)
  - **Excepciones/casos límite**

### 2.2 Esquema de IDs propuesto
- `RF-###` Requerimiento funcional
- `RNF-###` Requerimiento no funcional
- `DATA-###` Requerimiento de datos
- `INT-###` Interfaces externas (UI/API/Proveedores)
- `LEGAL-###` Legal/privacidad/retención
- `KPI-###` Definiciones de KPIs

### 2.3 Artefactos mínimos a generar
- `SRS_Monotickets_Platinum_v1.2.md`
- `TRACEABILIDAD_SRS_v1.2.csv` (o `.md` con tabla)
- `OPENAPI_monotickets.yaml` (o referencia oficial si ya existe)
- `DECISION_LOG.md` (decisiones SRS vs “as-built”)
- `GAP_REPORT_SRS_vs_IMPLEMENTACION.md`

---

## 3) Plan por sprints (propuesto)
> Suposición: sprints de 2 semanas (excepto Sprint 0 de 1 semana). Ajustable.

### Sprint 0 (1 semana) — Saneamiento y baseline
**Objetivo:** dejar el documento listo para iterar sin ruido y con trazabilidad.

**Entregables**
- SRS normalizado a **UTF-8** y símbolos consistentes (≤, ≥, →).
- Plantilla SRS v1.2 (estructura fija + secciones obligatorias).
- Esquema de IDs + convención de versiones.
- `GAP_REPORT_SRS_vs_IMPLEMENTACION.md` inicial (alto nivel).
- `DECISION_LOG.md` inicial (con decisiones pendientes).

**Trabajo**
- Corregir codificación y reemplazar caracteres corruptos.
- Acordar “fuente de verdad” por tema (SRS vs implementación vs decisión nueva).
- Crear matriz de trazabilidad vacía con columnas:
  - ID, Descripción, Prioridad, Módulo, Rol, Endpoint/UI, Criterio de aceptación, Caso de prueba, Estado.

**Definición de hecho (DoD)**
- Documento legible y consistente (sin caracteres corruptos).
- IDs definidos y aplicados a al menos el esqueleto (capítulos y subsecciones).

---

### Sprint 1 (2 semanas) — Funcionales por módulo + roles
**Objetivo:** convertir 3.1 en un set de requisitos funcionales completos (con criterios de aceptación).

**Entregables**
- Requisitos funcionales por módulo (Auth, Director, Planner, Guests/Invitations, Delivery, Scanner, Guest Landing).
- Matriz de permisos por rol (PLANNER/STAFF/DIRECTOR_GLOBAL/INVITADO).
- Flujos principales “≤ 4 acciones” definidos y medibles (por pantalla/acción).
- Primera versión utilizable de `TRACEABILIDAD_SRS_v1.2.*`.

**Trabajo**
- Desglosar historias en RF con criterios de aceptación tipo Given/When/Then.
- Definir claramente:
  - Publicación/cierre/bloqueo de evento
  - Ventana RSVP (20 días desde `invite_received_at`) y sus casos límite
  - Gestión de invitados (CSV, edición posterior, anfitrión/host link)
  - Generación/invalidación de invitaciones

**DoD**
- Cada RF tiene: descripción, precondiciones, postcondiciones, criterios de aceptación y errores esperados.

---

### Sprint 2 (2 semanas) — Datos, estados y métricas (core operacional)
**Objetivo:** cerrar el modelo de datos y la “máquina de estados completa” para que QA/backend tengan reglas exactas.

**Entregables**
- Modelo de datos (ER lógico) + `DATA-###` (campos, constraints e índices).
- Máquina de estados completa (Evento/Invitado RSVP/Invitación/QR/Delivery/Scan) con transiciones y guardas.
- Catálogo de resultados de scanner: `VALID_FULL`, `VALID_PARTIAL`, `DUPLICATE`, `EXPIRED`, `REVOKED`, `NOT_CONFIRMED`, `EVENT_BLOCKED`, `INVALID` (definición exacta y prioridad de reglas).
- Definición operativa de KPIs y fuentes de datos (v1): `KPI-###`.

**Trabajo**
- Definir eventos de auditoría mínimos (sin “log textual detallado”, pero con evidencias suficientes).
- Establecer qué significa “delivered” (por canal) vs “sent”.
- Especificar `remaining_count`, `entered_names`, y registro de scans.

**DoD**
- Estados/transiciones no dejan ambigüedad; QA puede derivar pruebas sin preguntar “qué pasa si…”.

---

### Sprint 3 (2 semanas) — Interfaces externas (API + proveedores + UI)
**Objetivo:** hacer el sistema especificable de punta a punta (UI↔API↔Proveedores).

**Entregables**
- OpenAPI completo o “contrato oficial” (si ya existe, referenciarlo y completar huecos).
- Especificación de import/export CSV/Excel con ejemplos y validaciones.
- Especificación Delivery (SMS + WhatsApp): reintentos (3), fallas permanentes, reenvío manual, webhooks (si aplica), estados por canal.
- Requisitos UI para:
  - Panel Planner
  - Panel Director Global
  - Scanner Staff (incluye PWA y permisos de cámara)
  - Landing Invitado (Premium/PDF)

**Trabajo**
- Normalizar paginación, filtros y errores (códigos, payload y mensajes).
- Definir explícitamente autenticación por rol y tokens (incluyendo “login por token” de staff).

**DoD**
- Un equipo externo podría implementar un cliente solo con el contrato y el SRS.

---

### Sprint 4 (2 semanas) — NFR, seguridad, privacidad y QA (cierre SRS)
**Objetivo:** cerrar RNF/LEGAL y dejar trazabilidad completa + plan de pruebas.

**Entregables**
- RNF completos: rendimiento, disponibilidad, escalabilidad, mantenibilidad, portabilidad y usabilidad con métricas medibles.
- Seguridad: controles mínimos (JWT, rate limit `/scanner/validate`, hardening OWASP) y threat model básico.
- Privacidad/retención: anonimización a 12 meses + borrado total bajo solicitud (`LEGAL-###`) con criterios verificables.
- Matriz de trazabilidad completa (RF/RNF/DATA/INT/LEGAL/KPI → pruebas → evidencia).
- SRS v1.2 listo para aprobación.

**DoD**
- Cobertura de trazabilidad ≥ 95% (todo lo “in scope” con prueba asociada o justificación).
- Sección de “decisiones” cerrada o con pendientes explícitos.

---

## 4) Backlog base (épicas sugeridas)
- **E1: Normalización y trazabilidad del SRS**
- **E2: Requerimientos funcionales por módulo**
- **E3: Modelo de datos + estados + scanner rules**
- **E4: Contratos API + import/export**
- **E5: Delivery (SMS/WhatsApp) + métricas**
- **E6: NFR + seguridad + privacidad + QA**

---

## 5) Notas de alineación con implementación (a validar en Sprint 0–1)
> Observación: existe implementación backend en `monotickets-api` con módulos `scanner`, `rsvp`, `invitations`, etc. Se recomienda decidir explícitamente si:
- El SRS **cambia** para reflejar el “as-built”, o
- La implementación **cambia** para cumplir el SRS (ej.: QR “JWT firmado” vs token custom).

Registrar cada decisión en `DECISION_LOG.md` con:
- Tema, contexto, decisión, alternativa descartada, impacto, dueño y fecha.

---

## 6) Resultado esperado
Al finalizar Sprint 4:
- SRS v1.2 completo y consistente (sin ambigüedad operacional).
- Contratos y formatos listos para QA/desarrollo.
- KPIs medibles y auditables.
- Trazabilidad completa para controlar alcance y evidenciar cumplimiento.

---

## 7) Progreso (Sprint 0 → Sprint 1)

**Artefactos actualizados**
- `SRS_Monotickets_Platinum_v1.2.md` con RF por módulo (Auth, Planner, Guests/Invitations, Delivery, Scanner, Guest Landing, Director), cada uno con pre/post/AC/errores.
- Matriz de permisos por rol + flujos principales “≤ 4 acciones” documentados dentro del SRS.
- `TRACEABILIDAD_SRS_v1.2.csv` ampliado con RF/RNF/DATA/LEGAL/KPI y referencia a pruebas (`TC-*`).
- `DECISION_LOG.md` y `GAP_REPORT_SRS_vs_IMPLEMENTACION.md` siguen como referencia de divergencias.

**Pendiente inmediato (siguiente paso)**
- Sprint 2: cerrar modelo de datos, máquina de estados completa y definición operativa de KPIs (alimentará `DATA-###` y `KPI-###`).
