# Render Deployment Configuration

## Build Settings

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:**
```
dist/monotickets-platinum/browser
```

**Node Version:**
```
18
```

## Important Notes

### Angular 18 Output Structure

Angular 18 usa el nuevo builder `@angular/build:application` que genera:
```
dist/
  └── monotickets-platinum/
      └── browser/          ← Este es el directorio a publicar
          ├── index.html
          ├── main-*.js
          └── styles-*.css
```

### Troubleshooting Common Errors

#### Error: "Publish directory not found"

**Causa**: Ruta incorrecta

**Solución**: Asegúrate que el Publish Directory sea exactamente:
```
dist/monotickets-platinum/browser
```

#### Error: "Build failed - npm install"

**Causa**: Node version incompatible

**Solución**: 
1. En Render Dashboard → Settings → Environment
2. Agregar variable:
   ```
   NODE_VERSION=18
   ```

#### Error: "Module not found"

**Causa**: Dependencies no instaladas

**Solución**: Verificar que el Build Command incluya `npm install`:
```bash
npm install && npm run build
```

#### Error: "Budget exceeded"

**Causa**: Bundle size warnings

**Solución**: Estos son solo warnings, no errores. El build continuará.

### Service Worker (PWA)

Si ves errores relacionados con `ngsw-config.json`:

**Opción 1**: Crear el archivo
```json
{
  "index": "/index.html",
  "assetGroups": []
}
```

**Opción 2**: Deshabilitar en `angular.json`:
```json
"production": {
  // Remover esta línea:
  // "serviceWorker": "ngsw-config.json"
}
```

## Render Dashboard Configuration

### Static Site Settings

```yaml
Name: monotickets-platinum
Region: Oregon (US West)
Branch: main
Root Directory: (leave empty)
Build Command: npm install && npm run build
Publish Directory: dist/monotickets-platinum/browser
Auto-Deploy: Yes
```

### Environment Variables

No se requieren para el frontend standalone.

Si necesitas conectar con backend:
```
API_URL=https://tu-backend.onrender.com
```

## Verification

Después del deploy, verifica:

1. ✅ URL carga: `https://monotickets-platinum.onrender.com`
2. ✅ Login muestra fondo navy
3. ✅ Botones cyan visibles
4. ✅ Tipografía Montserrat
5. ✅ No errores en consola del navegador

## Deploy Logs

Si el deploy falla, revisa los logs en:
Render Dashboard → tu-static-site → Logs

Busca:
- ❌ `Error: Cannot find module`
- ❌ `ENOENT: no such file or directory`
- ❌ `Build failed`

## Quick Fix Commands

Si necesitas rebuild:

```bash
# Local
npm install
npm run build

# Verificar output
ls dist/monotickets-platinum/browser
```

Debe mostrar:
```
index.html
main-*.js
styles-*.css
assets/
```

## Contact Support

Si persisten errores:
- Render Docs: https://render.com/docs/static-sites
- Angular Deployment: https://angular.dev/tools/cli/deployment
