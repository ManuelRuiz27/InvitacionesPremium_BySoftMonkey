# Monotickets Platinum - Frontend

Sistema de gestión de invitaciones digitales premium con identidad corporativa Monotickets.

## 🎨 UI/UX Redesign

**Versión**: 2.0 - Monotickets Premium  
**Última actualización**: Diciembre 2025

### Transformación Visual

- **Colores**: Navy (#0D1B2A) + Cyan (#4BA3FF)
- **Tipografía**: Montserrat + Poppins + Inter
- **Border Radius**: 16px
- **Design System**: 200+ CSS variables
- **Accesibilidad**: WCAG AA+

### Componentes Rediseñados

- ✅ Login
- ✅ Planner Dashboard
- ✅ Director Dashboard
- ✅ Event Forms
- ✅ Guest Forms
- ✅ Guest Landing

## 🚀 Tech Stack

- **Framework**: Angular 18
- **UI**: Angular Material
- **Icons**: Phosphor, Lucide, Tabler, Material Symbols
- **Styling**: SCSS + CSS Variables
- **Build**: Angular CLI

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

```bash
npm start
```

Abre [http://localhost:4200](http://localhost:4200)

## 🏗️ Build

```bash
npm run build
```

Output: `dist/monotickets-platinum`

## 🌐 Deploy

### Render Configuration

- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist/monotickets-platinum/browser`
- **Node Version**: 18.x

## 📁 Project Structure

```
src/
├── app/
│   ├── features/          # Módulos principales
│   │   ├── auth/          # Login
│   │   ├── planner/       # Dashboard & Forms
│   │   ├── director/      # Admin Dashboard
│   │   └── guest/         # Landing & RSVP
│   ├── styles/            # Design System
│   │   ├── design-system.scss
│   │   └── icon-utilities.scss
│   └── assets/
│       └── icons/custom/  # SVG custom
└── styles.scss            # Global styles
```

## 🎨 Design System

### CSS Variables

- **Colores**: 15 variables
- **Tipografía**: 20 variables
- **Espaciado**: 12 variables (escala 4px)
- **Bordes**: 6 variables
- **Sombras**: 9 variables
- **Transiciones**: 7 variables

### Icon Libraries

- **Phosphor Icons**: Guest Landing
- **Lucide Icons**: Planner
- **Tabler Icons**: Director + Planner
- **Material Symbols**: Staff Scanner
- **Custom SVG**: 6 iconos de eventos

## 📊 Bundle Size

- **CSS**: 294KB → 37KB (gzipped)
- **Build Success**: 100%

## 🔒 Environment Variables

No se requieren variables de entorno para el frontend standalone.

## 📝 License

Proprietary - Monotickets © 2025

## 👥 Team

- **UI/UX Redesign**: Sprint 1 & 2 (Diciembre 2025)
- **Original Development**: Monotickets Team

---

**Status**: ✅ Production Ready
