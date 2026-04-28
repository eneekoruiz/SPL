# SPL Booking & CMS Platform

Este repositorio contiene la aplicación SaaS de reservas y gestión para `SPL`, construida con **Vite + React + TypeScript**, con una arquitectura híbrida que también mantiene carpetas `app/` y `apps/backend/` para posibles extensiones.

## Qué incluye este proyecto

- **Frontend principal:** `src/` con componentes React, hooks, contextos y páginas.
- **Administración / CMS:** `/portal-reservado` con edición de contenido y gestión de servicios.
- **Multi-tenant / theme:** `src/contexts/TenantContext.tsx` y `TenantSwitcher` para cambiar instancias o marcas.
- **Backend BaaS:** Firebase Firestore/Auth/Storage, con variables de entorno en `.env.example`.
- **Testing:** `test-saas-e2e.js` y configuración de Playwright/Vitest.

## Uso local

### 1. Instalar dependencias

```powershell
cd "c:\Users\itxas\OneDrive\Escritorio\SPL"
npm install
```

### 2. Configurar entorno

Copia `.env.example` a `.env` y rellena las variables:

```bash
cp .env.example .env
```

Después completa:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Opcional:

- `VITE_CLOUDINARY_API_KEY`
- `VITE_CLOUDINARY_API_SECRET`

### 3. Levantar el proyecto

```powershell
npm run dev
```

Abre el navegador en la URL que indique Vite, normalmente:

- `http://localhost:5173`

### 4. Ver la app en producción local

```powershell
npm run build
npm run preview
```

## Cómo se gestiona este SPL

### Panel administrativo

Accede como administrador a:

- `http://localhost:5173/portal-reservado`

Desde allí se gestionan:

- servicios y productos
- visibilidad pública
- contenido editable de la web
- reservas y clientes en la sección CRM

### Contenido editable

El sistema usa varios hooks para cargar y actualizar contenido directamente desde Firestore:

- `src/hooks/useServices.ts`
- `src/hooks/useAboutContent.ts`
- `src/hooks/useAdminSettings.ts`
- `src/hooks/useRevista.ts`

### Tenant / instancias

La aplicación está preparada para multi-tenant con temas y parámetros de marca:

- `src/contexts/TenantContext.tsx`
- `src/components/TenantSwitcher.tsx`

Para crear una nueva instancia de tenant, define un nuevo objeto en `TENANT_THEMES` dentro de `src/contexts/TenantContext.tsx`, con:

- `id`
- `name`
- `brandColor`
- `secondaryColor`
- `fontFamily`
- `description`
- `logo`

Ejemplo:

```ts
const TENANT_THEMES = {
  ana: { ... },
  lola: { ... },
  nueva: {
    id: "nueva",
    name: "Nueva Marca",
    brandColor: "#123456",
    secondaryColor: "#abcdef",
    fontFamily: "Inter, sans-serif",
    description: "Nueva instancia SaaS",
    logo: "🌀",
  },
};
```

Luego cambia la instancia en el `TenantSwitcher` o añadiendo `?tenant=nueva` a la URL.

## Árbol del proyecto

Estructura principal:

```text
SPL/
├─ app/
│  ├─ [tenant]/layout.tsx
│  └─ [tenant]/not-found.tsx
├─ apps/
│  └─ backend/
│     ├─ middleware.ts
│     ├─ next.config.mjs
│     └─ src/
├─ core/
│  └─ db/tenantFactory.ts
├─ features/
│  └─ shared/
│     ├─ components/PoweredBySaaS.tsx
│     └─ index.ts
├─ public/
├─ src/
│  ├─ App.tsx
│  ├─ components/
│  │  ├─ Footer.tsx
│  │  ├─ LazyImage.tsx
│  │  ├─ AdminRoute.tsx
│  │  └─ cms/
│  ├─ contexts/
│  │  ├─ AuthContext.tsx
│  │  └─ TenantContext.tsx
│  ├─ hooks/
│  │  ├─ useAboutContent.ts
│  │  ├─ useAdminSettings.ts
│  │  ├─ usePrefetch.ts
│  │  ├─ useRevista.ts
│  │  └─ useServices.ts
│  ├─ lib/
│  │  ├─ firebase.ts
│  │  ├─ firestore.ts
│  │  └─ queryClient.ts
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  ├─ AdminDashboard.tsx
│  │  └─ Reservation.tsx
│  └─ index.css
├─ .env.example
├─ package.json
└─ README.md
```

## Comandos disponibles

```bash
npm run dev         # iniciar servidor de desarrollo
npm run build       # compilar para producción
npm run preview     # vista previa de la build
npm run lint        # ejecutar ESLint
npm run test        # ejecutar pruebas Vitest
npm run test:watch  # pruebas en modo vigilancia
```

## Cómo crear una nueva instancia de la aplicación

1. Copia `.env.example` a `.env`.
2. Rellena las variables de Firebase.
3. Si necesitas Cloudinary, agrega `VITE_CLOUDINARY_API_KEY` y `VITE_CLOUDINARY_API_SECRET`.
4. Añade un nuevo tenant en `src/contexts/TenantContext.tsx`.
5. Inicia `npm run dev`.
6. Abre el navegador en `http://localhost:5173/?tenant=<id>`.

## Subir cambios a GitHub

Para guardar y publicar este README en GitHub:

```bash
git add README.md .env.example
git commit -m "Actualiza README con instrucciones de uso y estructura del proyecto"
git push origin master
```
