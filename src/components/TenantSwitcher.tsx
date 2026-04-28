/**
 * components/TenantSwitcher.tsx
 *
 * Componente para cambiar entre tenants en desarrollo
 */

import { useTenant } from '@/contexts/TenantContext';

export function TenantSwitcher() {
  const { tenant, setTenant, availableTenants } = useTenant();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      fontSize: '14px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        Tenant: {tenant.name}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {Object.values(availableTenants).map((t) => (
          <button
            key={t.id}
            onClick={() => setTenant(t.id)}
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: tenant.id === t.id ? 'var(--primary)' : 'white',
              color: tenant.id === t.id ? 'white' : 'black',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
