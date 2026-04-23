/**
 * app/[tenant]/layout.tsx
 * 
 * VARIATION POINT (SPL) - Inyección Dinámica de Marca
 * 
 * Este layout:
 * 1. Captura el parámetro [tenant] del URL
 * 2. Fetch a tenants/{tenantId}/config en Firestore
 * 3. Establece variables CSS dinámicas
 * 4. Renderiza a los hijos con contexto de tenant
 */

import React, { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { createValidatedTenant, getTenantDb, TENANT_COLLECTIONS } from '@/core/db';
import { TenantConfig } from '@/core/types';
import '../globals.css';

interface TenantLayoutProps {
  children: ReactNode;
  params: {
    tenant: string;
  };
}

/**
 * Componente Servidor: Fetch de configuración tenant-aware
 */
export async function generateMetadata({ params }: { params: { tenant: string } }) {
  const { tenant } = params;

  try {
    const validatedTenant = createValidatedTenant(tenant);
    const db = getTenantDb(validatedTenant);

    const config = await db.getDocumentById(TENANT_COLLECTIONS.SETTINGS, 'brand');
    const tenantName = config?.name || tenant;
    const description = config?.description || 'SaaS Platform';

    return {
      title: tenantName,
      description,
      icons: {
        icon: config?.favicon || '/favicon.ico',
        apple: config?.favicon,
      },
    };
  } catch (error) {
    return {
      title: 'Not Found',
      description: 'Tenant not found',
    };
  }
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenant } = params;
  
  // =========================================================================
  // PASO 1: Validar tenant (TypeScript + Regex)
  // =========================================================================
  let validatedTenant;
  try {
    validatedTenant = createValidatedTenant(tenant);
  } catch (error) {
    notFound();
  }

  // =========================================================================
  // PASO 2: Fetch configuración del tenant desde Firestore
  // =========================================================================
  let tenantConfig: TenantConfig | null = null;
  try {
    const db = getTenantDb(validatedTenant);
    tenantConfig = (await db.getDocumentById(
      TENANT_COLLECTIONS.SETTINGS,
      'brand'
    )) as TenantConfig | null;
  } catch (error) {
    console.error(`[TenantLayout] Error loading config for tenant ${tenant}:`, error);
    // Continuar con valores por defecto si el fetch falla
  }

  // Valores por defecto (si no existe config en Firestore)
  const brandColor = tenantConfig?.brandColor || '#6366f1';
  const fontFamily = tenantConfig?.fontFamily || 'system-ui';
  const logo = tenantConfig?.logo || '/default-logo.svg';
  const name = tenantConfig?.name || tenant;

  // =========================================================================
  // PASO 3: Crear estilos dinámicos con variables CSS nativas
  // =========================================================================
  const cssVariables = `
    :root {
      --primary: ${brandColor};
      --font-family: ${fontFamily};
      --tenant-name: "${name}";
      --tenant-logo: url('${logo}');
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
        }}
      >
        {/* Context Provider para inyectar tenantId en toda la app */}
        <TenantProvider tenantId={validatedTenant.id} config={tenantConfig || undefined}>
          {children}
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
  config?: TenantConfig;
}

const TenantContext = createContext<TenantContextType | null>(null);

function TenantProvider({
  children,
  tenantId,
  config,
}: {
  children: ReactNode;
  tenantId: string;
  config?: TenantConfig;
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
