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
- Confirmación de asistencia
- QR dinámico con control grupal
- Escaneo y control de acceso
- Métricas por evento y globales
- Exportación de reportes

---

### 2.3 Características de los Usuarios

| Rol | Características |
|---|---|
| Planner | Wedding planners, organizadores de XV años, graduaciones |
| Staff | Personal de acceso con dispositivos móviles |
| Invitado | Usuario no técnico, mobile-first |
| Director Global | Usuario administrativo del ecosistema |

---

### 2.4 Restricciones Generales
- Idioma: Español (México)
- Zona horaria única: CDMX
- Máx. 5 eventos simultáneos
- Máx. 1000 invitados por evento
- Máx. 1000 invitaciones por evento
- QR válido solo el día del evento

---

### 2.5 Suposiciones y Dependencias
- Invitados con smartphone y navegador moderno
- Staff con cámara funcional
- Conectividad móvil durante el evento

---

## 3. Requerimientos Específicos

---

## 3.1 Requerimientos Funcionales

### 3.1.1 Historias de Usuario (Resumen)
- Crear evento
- Seleccionar plantilla
- Cargar invitados
- Enviar invitaciones
- Confirmar asistencia
- Escanear QR
- Controlar acceso parcial
- Ver métricas
- Exportar reportes

---

### 3.1.2 Reglas Funcionales Críticas

#### Eventos
- Estados: `DRAFT → PUBLISHED → CLOSED → BLOCKED`
- Publicación: solo Planner
- Cierre automático: **72 horas después de la hora del evento (CDMX)**

#### Confirmaciones
- Planner puede confirmar manualmente
- Invitado puede revocar confirmación **hasta 20 días desde la recepción de la invitación**

#### QR Dinámico
- Válido **únicamente** de 00:00 a 23:59 del día del evento (CDMX)
- guestCount configurable de 1 a 10
- Entrada parcial permitida
- Staff marca quién entra desde lista de nombres
- remaining_count se reduce en cada acceso

#### Delivery
- Envío siempre por doble canal:
  1. SMS
  2. WhatsApp
- Hasta 3 reintentos automáticos por canal
- Reenvío manual permitido
- Número inválido:
  - Se marca como inválido
  - Se sugieren alternativas:
    - Generar link/QR
    - Imprimir lista/QR

#### Alertas
- Si más del 10% de envíos fallan en un evento:
  - Se genera alerta visible en panel del Director Global

---

## 3.2 Requerimientos No Funcionales

### 3.2.1 Rendimiento
- Tiempo de carga landing Premium (4G): **≤ 3 segundos**
- Peso máximo landing Premium: **≤ 3 MB**

---

### 3.2.2 Seguridad
- JWT firmado para QR
- Validación de firma en cada escaneo
- Control de acceso por rol
- QR inválido fuera de fecha

---

### 3.2.3 Usabilidad
- Mobile-first
- Flujos ≤ 4 acciones
- Feedback visual inmediato en escaneo

---

### 3.2.4 Confiabilidad
- Disponibilidad documentada: **99.0% mensual**
- Registro persistente de escaneos

---

### 3.2.5 Mantenibilidad
- Arquitectura modular
- Separación clara de dominios

---

### 3.2.6 Portabilidad
- Web responsive
- Compatible con navegadores modernos

---

### 3.2.7 Escalabilidad
- Hasta 5 eventos simultáneos
- Hasta 1000 invitados por evento sin degradación perceptible

---

## 3.3 Requerimientos de Interfaz Externa

### 3.3.1 Interfaces de Usuario
- Panel Planner
- Panel Director Global
- Scanner Staff
- Landing Invitado

---

### 3.3.2 Interfaces de Hardware
- Cámara del dispositivo móvil (staff)

---

### 3.3.3 Interfaces de Software
- Proveedor SMS
- WhatsApp Cloud API
- Base de datos relacional

---

### 3.3.4 Interfaces de Comunicación
- HTTPS
- REST JSON
- JWT

---

## 3.4 Otros Requerimientos

### 3.4.1 Requerimientos Legales y Regulatorios
- Anonimización de datos personales a los **12 meses**
- Conservación de métricas agregadas
- Borrado manual bajo solicitud del planner

---

### 3.4.2 Requerimientos de Datos
- Exportación CSV/Excel de:
  - Invitados
  - RSVP
  - Asistencia

---

## 4. KPIs del MVP

| KPI | Objetivo |
|---|---|
| Invitaciones entregadas | ≥ 95% |
| RSVP sobre entregadas | ≥ 65% |
| Show-up sobre confirmados | ≥ 90% |
| Tiempo de carga landing | ≤ 3 s |
| Peso landing Premium | ≤ 3 MB |
| Time-to-RSVP esperado | ≤ 7 días |

---

## 5. Estado del Documento
- Versión: **1.1**
- Estado: **Aprobado para desarrollo**
- Ambigüedad residual: **Nula**
- Nivel: **Producción / Implementación directa**