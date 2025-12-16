# Decision Log — Monotickets Platinum (SRS v1.2)

Registro de decisiones para alinear `SRS_Monotickets_Platinum_v1.2.md` con la implementación actual (`monotickets-api`, `monotickets-platinum`) y/o definiciones nuevas de producto.

## Formato

| ID | Fecha | Estado | Tema | Decisión | Alternativas | Impacto | Dueño |
|---|---|---|---|---|---|---|---|
| DEC-001 | 2025-12-14 | PENDIENTE | QR dinámico | ¿El QR será JWT firmado (SRS v1.1) o token string (as-built)? | JWT / Token string | Scanner, seguridad, expiración, contratos API | PO/Tech Lead |
| DEC-002 | 2025-12-14 | PENDIENTE | Estados de evento | ¿Se adoptan estados DRAFT/PUBLISHED/CLOSED/BLOCKED en DB/API? | Sí / No | Flujos Planner/Director, reglas de scanner, métricas | PO/Tech Lead |
| DEC-003 | 2025-12-14 | PENDIENTE | RSVP ventana 20 días | ¿Cómo se calcula exactamente (`invite_received_at`) y qué casos límite aplican? | Según SRS / Ajuste | Backend, landing invitado, QA | PO |
| DEC-004 | 2025-12-14 | PENDIENTE | Delivery por canal | ¿Estados por canal + reintentos (3) + webhooks? | Completo / Simplificado | Integración proveedores, KPIs, auditoría | Tech Lead |
| DEC-005 | 2025-12-14 | PENDIENTE | Entrada parcial | ¿Se soporta `remaining_count` y selección de nombres en scanner? | Sí / No | Scanner UX, modelo de datos, reglas | PO/Tech Lead |

## Guía de uso
- Crear un `DEC-###` por cada discrepancia SRS vs as-built o definición nueva.
- Marcar `Estado`: `PENDIENTE` → `APROBADA` / `DESCARTADA`.
- Cuando esté `APROBADA`, referenciar el `DEC-###` desde el requisito correspondiente (RF/RNF/DATA/INT/LEGAL/KPI).

