/**
 * app/[tenant]/page.tsx
 * 
 * Home page del tenant - Accesible en: ana.localhost:3000 o ana.tudominio.com
 */

'use client';

import { useTenant } from './layout';

export default function TenantHomePage() {
  const { tenantId, config } = useTenant();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Bienvenido a {config?.name || tenantId}</h1>
      <p>SaaS Multi-Tenant con Feature-Sliced Design</p>
      <div style={{ marginTop: '1rem', color: 'var(--primary)' }}>
        <p>Tenant ID: <strong>{tenantId}</strong></p>
        {config && (
          <>
            <p>Color Primario: <strong>{config.brandColor}</strong></p>
            <p>Fuente: <strong>{config.fontFamily}</strong></p>
          </>
        )}
      </div>
    </div>
  );
}
