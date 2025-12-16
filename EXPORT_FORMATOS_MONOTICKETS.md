# Monotickets Platinum — Formatos de Exportación (CSV / Excel)

Todos los reportes descargados desde `GET /exports/(guests|rsvp|attendance)/:eventId` comparten las mismas columnas en CSV y Excel (`?format=csv|xlsx`). Los nombres de columnas son estables (snake_case) para CSV y usan títulos amigables en Excel.

## 1. Invitados (`/exports/guests/:eventId`)
| Columna (CSV) | Columna (Excel) | Tipo | Descripción / Ejemplo |
| --- | --- | --- | --- |
| fullName | Nombre | Texto | Nombre completo del invitado (`María López`). |
| phone | Teléfono | Texto | Número en formato E.164 (`+521555001002`). |
| email | Email | Texto (opcional). |
| guestCount | Invitados | Entero (1-10). |
| rsvpStatus | RSVP | Texto (`PENDING`, `CONFIRMED`, `DECLINED`). |
| inviteReceivedAt | Invite Received | ISO 8601 (`2025-12-01T18:00:00.000Z`). |
| confirmedAt | Confirmed At | ISO 8601 o vacío. |
| declinedAt | Declined At | ISO 8601 o vacío. |

## 2. RSVP (`/exports/rsvp/:eventId`)
| Columna (CSV) | Columna (Excel) | Tipo | Descripción |
| --- | --- | --- | --- |
| fullName | Nombre | Texto. |
| rsvpStatus | RSVP | Texto (`CONFIRMED`, `DECLINED`). |
| guestCount | Invitados | Entero. |
| confirmedAt | Confirmed At | Fecha/hora. |
| declinedAt | Declined At | Fecha/hora. |

## 3. Asistencia (`/exports/attendance/:eventId`)
| Columna (CSV) | Columna (Excel) | Tipo | Descripción |
| --- | --- | --- | --- |
| guestName | Nombre | Texto. |
| scannedAt | Fecha Escaneo | Fecha/hora del scan. |
| status | Estado | Texto (`VALID_FULL`, `VALID_PARTIAL`). |
| enteredNames | Ingresos | Lista separada por coma con los nombres marcados. |
| peopleCount | Personas | Entero (personas capturadas en ese scan). |

## Convenciones
- Los archivos CSV usan `utf-8` y separador `,`.
- Los archivos Excel usan `.xlsx` y cada dataset se entrega en una sola hoja.
- El parámetro `format` es obligatorio cuando se desea Excel (`?format=xlsx`); si no se indica, la respuesta será CSV.
