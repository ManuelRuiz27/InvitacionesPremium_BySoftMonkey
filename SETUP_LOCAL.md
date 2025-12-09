# Monotickets - Guía de Configuración Local

## 📋 Requisitos Previos

- **Node.js**: v18 o superior
- **npm**: v9 o superior
- **Docker Desktop**: Para ejecutar PostgreSQL

## 🚀 Configuración Inicial

### 1. Iniciar la Base de Datos con Docker

```bash
# Navegar al directorio del API
cd monotickets-api

# Iniciar PostgreSQL con Docker Compose
docker-compose up -d

# Verificar que el contenedor está corriendo
docker ps
```

Deberías ver un contenedor llamado `monotickets-db` en estado `Up`.

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

El archivo `.env` ya contiene la configuración correcta para Docker:
```
DATABASE_URL="postgresql://monotickets:monotickets_dev_2024@localhost:5432/monotickets_db?schema=public"
```

### 3. Instalar Dependencias del Backend

```bash
# Asegúrate de estar en monotickets-api
npm install
```

### 4. Configurar la Base de Datos

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar la base de datos con datos de prueba
npm run prisma:seed
```

### 5. Iniciar el Backend

```bash
# Modo desarrollo (con hot-reload)
npm run start:dev
```

El backend estará disponible en:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api

### 6. Verificar el Frontend

El frontend ya está corriendo en otro terminal. Asegúrate de que esté configurado para conectarse a `http://localhost:3000`.

## 👥 Usuarios de Prueba

Todos los usuarios tienen la misma contraseña: **`Test123!`**

### Director Global
- **Email**: `director@test.com`
- **Rol**: Acceso completo al sistema
- **Permisos**: Ver todos los eventos, gestionar usuarios

### Planners (Organizadores)
- **Email**: `planner1@test.com`
  - **Nombre**: María García - Planner
  - **Eventos**: Boda de Sofía y Miguel, XV Años de Valentina

- **Email**: `planner2@test.com`
  - **Nombre**: Carlos Rodríguez - Planner
  - **Eventos**: Conferencia Tech Summit 2024

### Staff (Personal de Escaneo)
- **Email**: `staff1@test.com`
  - **Nombre**: Ana López - Staff
  - **Función**: Escanear QR codes en eventos

- **Email**: `staff2@test.com`
  - **Nombre**: Juan Martínez - Staff
  - **Función**: Escanear QR codes en eventos

## 📅 Eventos de Prueba

### 1. Boda de Sofía y Miguel
- **Fecha**: 20 de Diciembre, 2024 - 18:00
- **Ubicación**: Jardín Botánico, Ciudad de México
- **Planner**: María García
- **Invitados**: 4 (9 personas en total)
  - Roberto y Laura Fernández (2 personas) - ✅ Confirmado
  - Patricia Morales (1 persona) - ✅ Confirmado
  - Familia Sánchez (4 personas) - ⏳ Pendiente
  - Diego y Carmen Torres (2 personas) - ❌ Declinado

### 2. XV Años de Valentina
- **Fecha**: 28 de Diciembre, 2024 - 19:00
- **Ubicación**: Salón de Eventos Las Rosas, Guadalajara
- **Planner**: María García
- **Invitados**: 3 (8 personas en total)
  - Familia González (5 personas) - ✅ Confirmado
  - Andrea y Luis Ramírez (2 personas) - ✅ Confirmado
  - Sofía Mendoza (1 persona) - ⏳ Pendiente

### 3. Conferencia Tech Summit 2024
- **Fecha**: 15 de Enero, 2025 - 09:00
- **Ubicación**: Centro de Convenciones, Monterrey
- **Planner**: Carlos Rodríguez
- **Invitados**: 4 (6 personas en total)
  - Ing. Ricardo Vega (1 persona) - ✅ Confirmado
  - Dra. Elena Castro (1 persona) - ✅ Confirmado
  - Equipo StartupMX (3 personas) - ✅ Confirmado
  - Prof. Alberto Ruiz (1 persona) - ⏳ Pendiente

## 🧪 Flujos de Prueba

### Como Planner (Organizador)

1. **Login**: Usa `planner1@test.com` / `Test123!`
2. **Ver Eventos**: Deberías ver 2 eventos (Boda y XV Años)
3. **Crear Nuevo Evento**:
   - Nombre, fecha, ubicación
   - Agregar invitados
   - Generar invitaciones con QR
4. **Gestionar Invitados**:
   - Ver lista de invitados
   - Ver estado de RSVP
   - Enviar invitaciones

### Como Staff (Personal)

1. **Login**: Usa `staff1@test.com` / `Test123!`
2. **Seleccionar Evento**: Elegir evento para escanear
3. **Escanear QR**: Usar los QR tokens generados
4. **Verificar Check-in**: Ver lista de asistentes

### Como Director Global

1. **Login**: Usa `director@test.com` / `Test123!`
2. **Dashboard**: Ver métricas de todos los eventos
3. **Gestión**: Acceso a todos los eventos y usuarios

## 🛠️ Comandos Útiles

### Docker
```bash
# Detener la base de datos
docker-compose down

# Reiniciar la base de datos (borra datos)
docker-compose down -v
docker-compose up -d

# Ver logs de PostgreSQL
docker logs monotickets-db
```

### Prisma
```bash
# Abrir Prisma Studio (GUI para ver la DB)
npm run prisma:studio

# Resetear la base de datos
npm run prisma:migrate reset

# Volver a poblar con datos de prueba
npm run prisma:seed
```

### Backend
```bash
# Ver logs en tiempo real
npm run start:dev

# Ejecutar en modo debug
npm run start:debug
```

## 🔍 Verificación

### 1. Verificar Base de Datos
```bash
# Abrir Prisma Studio
npm run prisma:studio
```
Navega a http://localhost:5555 y verifica:
- 5 usuarios
- 3 eventos
- 11 invitados
- 11 invitaciones

### 2. Verificar API
Abre http://localhost:3000/api en tu navegador para ver la documentación Swagger.

### 3. Verificar Login
Prueba hacer login desde el frontend con cualquiera de los usuarios de prueba.

## ❌ Solución de Problemas

### Error: "Can't reach database server"
```bash
# Verificar que Docker está corriendo
docker ps

# Si no está corriendo, iniciar
docker-compose up -d
```

### Error: "Port 5432 already in use"
Ya tienes PostgreSQL corriendo localmente. Opciones:
1. Detener PostgreSQL local
2. Cambiar el puerto en `docker-compose.yml` (ej: `5433:5432`)

### Error: "Prisma Client not generated"
```bash
npm run prisma:generate
```

### Error al hacer seed
```bash
# Resetear la base de datos
npm run prisma:migrate reset
# Confirmar con 'y'
```

## 📞 Soporte

Si encuentras algún problema, verifica:
1. Docker Desktop está corriendo
2. El contenedor `monotickets-db` está activo
3. Las variables de entorno en `.env` son correctas
4. Node.js y npm están en las versiones correctas
