# 🔑 Monotickets - Credenciales de Prueba

## Contraseña Universal
**Todos los usuarios**: `Test123!`

## 👤 Usuarios por Rol

### 🎯 Director Global
- **Email**: `director@test.com`
- **Nombre**: Director Global
- **Acceso**: Sistema completo, todos los eventos

### 📋 Planners (Organizadores)

#### Planner 1
- **Email**: `planner1@test.com`
- **Nombre**: María García - Planner
- **Eventos**:
  - Boda de Sofía y Miguel (20 Dic 2024)
  - XV Años de Valentina (28 Dic 2024)

#### Planner 2
- **Email**: `planner2@test.com`
- **Nombre**: Carlos Rodríguez - Planner
- **Eventos**:
  - Conferencia Tech Summit 2024 (15 Ene 2025)

### 📱 Staff (Personal de Escaneo)

#### Staff 1
- **Email**: `staff1@test.com`
- **Nombre**: Ana López - Staff
- **Función**: Escanear QR en eventos

#### Staff 2
- **Email**: `staff2@test.com`
- **Nombre**: Juan Martínez - Staff
- **Función**: Escanear QR en eventos

## 🌐 URLs del Sistema

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api
- **Prisma Studio**: http://localhost:5555 (ejecutar `npm run prisma:studio`)

## 📊 Estadísticas de Datos de Prueba

- **Usuarios**: 5 (1 Director, 2 Planners, 2 Staff)
- **Eventos**: 3
- **Invitados**: 11
- **Invitaciones**: 11 (con QR tokens únicos)
- **Total de personas**: 23

## 🎯 Flujos de Prueba Rápidos

### Como Planner
1. Login: `planner1@test.com` / `Test123!`
2. Ver eventos asignados
3. Gestionar invitados
4. Generar invitaciones

### Como Staff
1. Login: `staff1@test.com` / `Test123!`
2. Seleccionar evento
3. Escanear códigos QR
4. Verificar check-ins

### Como Director
1. Login: `director@test.com` / `Test123!`
2. Dashboard completo
3. Ver todos los eventos
4. Métricas globales
