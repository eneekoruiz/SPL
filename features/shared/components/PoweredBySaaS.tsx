/**
 * features/shared/components/PoweredBySaaS.tsx
 * 
 * Badge discreto que aparece en todos los tenants
 * Indica que la plataforma es gestionada por saas-reservas
 */

'use client';

export function PoweredBySaaS() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        margin: '1rem auto',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '#9ca3af',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
      }}
    >
      <span>⚡</span>
      <span>
        Plataforma gestionada por{' '}
        <a
          href="https://saas-reservas.com"
          style={{
            color: 'var(--primary, #6366f1)',
            textDecoration: 'none',
            fontWeight: '600',
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          SaaS Reservas
        </a>
      </span>
    </div>
  );
}

export default PoweredBySaaS;
