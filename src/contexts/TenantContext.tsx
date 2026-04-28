/**
 * contexts/TenantContext.tsx
 *
 * Contexto para manejar tenants en Vite (sin middleware Next.js)
 * Detecta tenant desde URL query param o localStorage
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TenantConfig {
  id: string;
  name: string;
  brandColor: string;
  secondaryColor: string;
  fontFamily: string;
  description: string;
  logo: string;
}

interface TenantContextType {
  tenant: TenantConfig;
  setTenant: (tenantId: string) => void;
  availableTenants: Record<string, TenantConfig>;
}

const TENANT_THEMES: Record<string, TenantConfig> = {
  ana: {
    id: 'ana',
    name: 'Ana Peluquería',
    brandColor: '#D97706', // Amber-600
    secondaryColor: '#FCD34D', // Amber-300
    fontFamily: 'Georgia, serif',
    description: 'Peluquería profesional con estilo elegante',
    logo: '💇‍♀️',
  },
  lola: {
    id: 'lola',
    name: 'Lola Estética',
    brandColor: '#000000', // Black
    secondaryColor: '#FFFFFF', // White
    fontFamily: 'Inter, sans-serif',
    description: 'Centro de estética minimalista',
    logo: '✨',
  },
};

const DEFAULT_TENANT: TenantConfig = {
  id: 'default',
  name: 'SaaS Reservas',
  brandColor: '#6366f1',
  secondaryColor: '#818CF8',
  fontFamily: 'system-ui',
  description: 'Plataforma SaaS multi-tenant',
  logo: '⚡',
};

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenantState] = useState<TenantConfig>(DEFAULT_TENANT);

  // Detectar tenant desde URL o localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    const storedTenant = localStorage.getItem('saas-tenant');

    const tenantId = tenantParam || storedTenant || 'ana'; // Default to 'ana'

    if (TENANT_THEMES[tenantId]) {
      setTenantState(TENANT_THEMES[tenantId]);
      localStorage.setItem('saas-tenant', tenantId);
    } else {
      setTenantState(DEFAULT_TENANT);
    }

    // Inyectar CSS variables dinámicas
    const root = document.documentElement;
    const currentTenant = TENANT_THEMES[tenantId] || DEFAULT_TENANT;
    root.style.setProperty('--primary', currentTenant.brandColor);
    root.style.setProperty('--secondary', currentTenant.secondaryColor);
    root.style.setProperty('--font-family', currentTenant.fontFamily);
    root.style.setProperty('--tenant-name', `"${currentTenant.name}"`);
    root.style.setProperty('--tenant-logo', `"${currentTenant.logo}"`);
  }, [tenant]);

  const setTenant = (tenantId: string) => {
    if (TENANT_THEMES[tenantId]) {
      setTenantState(TENANT_THEMES[tenantId]);
      localStorage.setItem('saas-tenant', tenantId);

      // Actualizar URL
      const url = new URL(window.location.href);
      url.searchParams.set('tenant', tenantId);
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <TenantContext.Provider value={{
      tenant,
      setTenant,
      availableTenants: TENANT_THEMES
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
