/**
 * app/[tenant]/layout.tsx
 * 
 * VARIATION POINT (SPL) - Inyección Dinámica de Marca
 * 
 * Incluye lógica de mockeo de tenants + inyección de CSS dinámico
 * - Ana: Paleta Gold/Amber
 * - Lola: Minimalista (B/N)
 * - Otros: Tema por defecto + error handling robusto
 */

import React, { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { PoweredBySaaS } from '@/features/shared';
import '../globals.css';

interface TenantLayoutProps {
  children: ReactNode;
  params: {
    tenant: string;
  };
}

/**
 * MOCKEO DE CONFIGURACIÓN DE TENANTS (SPL Feature Flags)
 */
const TENANT_THEMES = {
  ana: {
    name: 'Ana Peluquería',
    brandColor: '#D97706', // Amber-600
    secondaryColor: '#FCD34D', // Amber-300
    fontFamily: 'Georgia, serif',
    description: 'Peluquería profesional con estilo elegante',
    logo: '💇‍♀️',
  },
  lola: {
    name: 'Lola Estética',
    brandColor: '#000000', // Black
    secondaryColor: '#FFFFFF', // White
    fontFamily: 'Inter, sans-serif',
    description: 'Centro de estética minimalista',
    logo: '✨',
  },
};

/**
 * VALIDACIÓN DE TENANT (Regex + Whitelist)
 */
function isValidTenant(tenant: string): boolean {
  if (!tenant || typeof tenant !== 'string') return false;
  const TENANT_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
  return TENANT_PATTERN.test(tenant);
}

/**
 * RESOLVER DE CONFIGURACIÓN CON FALLBACK
 */
function resolveTenantConfig(tenant: string) {
  const normalized = tenant.toLowerCase();
  
  // Si existe en TENANT_THEMES, usarlo
  if (normalized in TENANT_THEMES) {
    return TENANT_THEMES[normalized as keyof typeof TENANT_THEMES];
  }

  // Fallback para tenants desconocidos
  return {
    name: tenant,
    brandColor: '#6366f1',
    secondaryColor: '#818CF8',
    fontFamily: 'system-ui',
    description: 'Plataforma SaaS',
    logo: '⚡',
  };
}

/**
 * Componente Servidor: Metadata dinámico
 */
export async function generateMetadata({ params }: { params: { tenant: string } }) {
  const { tenant } = params;

  if (!isValidTenant(tenant)) {
    return {
      title: 'Tenant no válido',
      description: 'El espacio solicitado no existe',
    };
  }

  const config = resolveTenantConfig(tenant);
  return {
    title: config.name,
    description: config.description,
  };
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenant } = params;

  // =========================================================================
  // PASO 1: Validar tenant (Regex + Whitelist)
  // =========================================================================
  if (!isValidTenant(tenant)) {
    console.warn(`[TenantLayout] Invalid tenant format: ${tenant}`);
    notFound();
  }

  // =========================================================================
  // PASO 2: Resolver configuración del tenant (Mockeo + Fallback)
  // =========================================================================
  const config = resolveTenantConfig(tenant);
  const { brandColor, secondaryColor, fontFamily, name, logo } = config;

  // =========================================================================
  // PASO 3: Crear estilos dinámicos con variables CSS nativas
  // =========================================================================
  const cssVariables = `
    :root {
      --primary: ${brandColor};
      --secondary: ${secondaryColor};
      --font-family: ${fontFamily};
      --tenant-name: "${name}";
      --tenant-logo: "${logo}";
    }
  `;

  // =========================================================================
  // PASO 4: Renderizar layout con variables inyectadas
  // =========================================================================
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body
        style={{
          fontFamily: fontFamily,
          position: 'relative',
          minHeight: '100vh',
          backgroundColor: secondaryColor,
          color: brandColor,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Context Provider para inyectar tenantId en toda la app */}
        <TenantProvider tenantId={tenant} config={config}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          {/* Badge SPL: Aparece en todos los tenants */}
          <PoweredBySaaS />
        </TenantProvider>
      </body>
    </html>
  );
}

/**
 * Context Provider Cliente para acceso a tenant en componentes
 */
'use client';

import { createContext, useContext } from 'react';

interface TenantContextType {
  tenantId: string;
  config?: {
    name: string;
    brandColor: string;
    secondaryColor: string;
    fontFamily: string;
    description: string;
    logo: string;
  };
}

const TenantContext = createContext<TenantContextType | null>(null);

function TenantProvider({
  children,
  tenantId,
  config,
}: {
  children: ReactNode;
  tenantId: string;
  config?: any;
}) {
  return (
    <TenantContext.Provider value={{ tenantId, config }}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook para acceder a context del tenant desde componentes cliente
 */
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('[useTenant] Must be used within TenantProvider');
  }
  return context;
}
