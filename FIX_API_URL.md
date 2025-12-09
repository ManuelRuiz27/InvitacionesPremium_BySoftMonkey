# Corrección de Configuración del Frontend

## Problema
El frontend no se conecta correctamente al backend porque la URL del API está duplicando el prefijo `/api`.

## Solución

### Archivo: `src/environments/environment.ts`

**Cambio realizado:**
```typescript
// ANTES
apiUrl: 'http://localhost:3000/api'

// DESPUÉS  
apiUrl: 'http://localhost:3000'
```

## Explicación

El backend de NestJS ya tiene configurado un **prefijo global** `/api` en el archivo `main.ts`:

```typescript
// Backend: src/main.ts
SwaggerModule.setup('api', app, document);
```

Esto significa que todas las rutas del backend ya están bajo `/api`.

Por ejemplo:
- Endpoint de login: `POST /api/auth/login`
- Swagger docs: `GET /api`

### Antes (Incorrecto)
- Frontend llamaba a: `http://localhost:3000/api/auth/login`
- Esto resultaba en: `http://localhost:3000/api/api/auth/login` ❌

### Después (Correcto)
- Frontend llama a: `http://localhost:3000/auth/login`
- El auth.service agrega el path: `/auth/login`
- URL final correcta: `http://localhost:3000/auth/login` ✅

## Verificación

1. **Reiniciar el frontend** (si es necesario):
   ```bash
   # El frontend debería recargar automáticamente
   # Si no, presiona Ctrl+C y ejecuta:
   npm start
   ```

2. **Probar login**:
   - Email: `planner1@test.com`
   - Password: `Test123!`

3. **Verificar en DevTools**:
   - Abrir Network tab (F12)
   - Buscar petición a `/auth/login`
   - Verificar que la URL sea: `http://localhost:3000/auth/login`
   - Status: 200 OK

## URLs Correctas del Sistema

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api
- **Login Endpoint**: http://localhost:3000/auth/login
- **Prisma Studio**: http://localhost:5555 (ejecutar `npm run prisma:studio`)
