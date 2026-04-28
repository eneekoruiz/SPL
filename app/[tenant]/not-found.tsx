/**
 * app/[tenant]/not-found.tsx
 * 
 * Página de error robusta para tenants inválidos
 * Diseño genérico que no rompe la app
 */

'use client';

export default function TenantNotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            fontSize: '4rem',
            marginBottom: '1rem',
          }}
        >
          ❌
        </div>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            color: '#111827',
          }}
        >
          Este espacio no existe
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: '#6b7280',
            marginBottom: '2rem',
            lineHeight: '1.5',
          }}
        >
          El subdominio o tenant solicitado no está registrado en nuestro sistema.
          Verifica que escribiste correctamente la URL.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6366f1',
              color: 'white',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = '#4f46e5')
            }
            onMouseOut={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = '#6366f1')
            }
          >
            Ir a inicio
          </a>

          <a
            href="mailto:support@saas-reservas.com"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e5e7eb',
              color: '#111827',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = '#d1d5db')
            }
            onMouseOut={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = '#e5e7eb')
            }
          >
            Contactar soporte
          </a>
        </div>

        <div
          style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid #d1d5db',
            fontSize: '0.85rem',
            color: '#9ca3af',
          }}
        >
          <p>
            <strong>Tenants válidos:</strong> ana, lola
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Ejemplo: <code style={{ backgroundColor: '#f3f4f6', padding: '0.2rem 0.4rem' }}>ana.tudominio.com</code>
          </p>
        </div>
      </div>
    </div>
  );
}
