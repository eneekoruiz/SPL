# SPL

Booking and content-management project built with Vite, React, TypeScript, and Firebase.

The repository contains a multi-tenant salon booking interface, editable public pages, admin screens, and backend integration points for appointments and calendar workflows.

## What it includes

- Public pages for services, magazine content, booking, and salon information.
- Admin-oriented screens for managing appointments and editable content.
- Firebase-backed data flows.
- Tenant-aware routing and theme configuration.

## Local development

```bash
npm install
npm run dev
npm run check
```

Frontend variables are documented in `.env.example`.

The API lives in `apps/backend`:

```bash
cd apps/backend
npm ci
npm run build
npm run dev
```

Backend variables are documented in `apps/backend/.env.example`. Firebase service-account data, Google credentials, Resend keys, and the Cloudinary API secret belong only in the backend environment. Production deployments must also set `ALLOWED_ORIGINS` explicitly.

## Architecture

The repository contains a Vite and React frontend plus the Next.js API under `apps/backend`. The frontend handles tenant-aware public pages, booking and administration; scheduling rules live in `src/lib/scheduler.ts` so they can be tested independently of the interface.

Backend route handlers validate requests and delegate authentication, booking, calendar, notification and storage work to modules under `apps/backend/src/lib`. Firebase Admin stores operational data, with Google Calendar and Resend used only by their corresponding integrations.

## Documentation

- [DeepWiki](https://deepwiki.com/eneekoruiz/SPL) for code exploration and supplementary documentation.
