import { NextRequest, NextResponse } from 'next/server';

/**
 * MIDDLEWARE BLINDADO PARA AISLAMIENTO MULTI-TENANT
 * 
 * REGLA CRÍTICA: Ignora explícitamente rutas estáticas y del sistema.
 * Cualquier fallo aquí causa bucles infinitos fatales.
 */

// Patrones de rutas a IGNORAR (Sin procesamiento tenant)
const IGNORED_PATTERNS = [
  // Next.js internals
  /^\/_next\//,
  // Static assets
  /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i,
  // System files
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  // API no-tenant (solo healthcheck, etc si es necesario)
  /^\/api\/health$/,
  // Public static folders
  /^\/public\//,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================================================
  // PASO 1: IGNORAR RUTAS PROTEGIDAS (Prevenir bucles infinitos)
  // ============================================================================
  for (const pattern of IGNORED_PATTERNS) {
    if (pattern.test(pathname)) {
      return NextResponse.next();
    }
  }

  // ============================================================================
  // PASO 2: EXTRAER TENANT DEL SUBDOMINIO
  // ============================================================================
  const host = request.headers.get('host') || '';
  const tenantMatch = host.match(/^([a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9])\.?/i);
  const tenantFromSubdomain = tenantMatch ? tenantMatch[1].toLowerCase() : null;

  // Detectar si es localhost o dominio raíz sin subdominio
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const isRootDomain = host.includes('ana-peluquera.com') || 
                       host.includes('localhost:3000') ||
                       host.includes('ana-peluquera.vercel.app');

  // Tenant por defecto para desarrollo/testing
  const DEFAULT_TENANT = 'ana';
  const tenant = tenantFromSubdomain || (isLocalhost || isRootDomain ? DEFAULT_TENANT : null);

  // ============================================================================
  // PASO 3: VERIFICAR TENANT VÁLIDO (Tipado en compilación)
  // ============================================================================
  if (!tenant) {
    return NextResponse.json(
      { error: 'Invalid tenant. Subdomain required.' },
      { status: 400 }
    );
  }

  // Validar tenant con Regex estricto (Solo alfanuméricos y guiones)
  const TENANT_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
  if (!TENANT_PATTERN.test(tenant)) {
    return NextResponse.json(
      { error: 'Invalid tenant format.' },
      { status: 400 }
    );
  }

  // ============================================================================
  // PASO 4: REWRITE A RUTA INTERNA CON TENANT COMO PARÁMETRO
  // ============================================================================
  // Si la ruta no comienza con /app/[tenant]/, reescribimos
  if (!pathname.startsWith(`/app/${tenant}`)) {
    const rewriteUrl = new URL(`/app/${tenant}${pathname === '/' ? '' : pathname}`, request.url);
    
    // Copiar query params
    rewriteUrl.search = request.nextUrl.search;

    // Inyectar tenant en headers para fácil acceso en componentes
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set('x-tenant-id', tenant);
    response.headers.set('x-tenant-host', host);

    return response;
  }

  // ============================================================================
  // PASO 5: VALIDACIÓN DE HEADERS Y PREPARACIÓN DE CONTEXTO
  // ============================================================================
  const response = NextResponse.next();
  
  // Inyectar tenant en headers (accesible en layout + páginas)
  response.headers.set('x-tenant-id', tenant);
  response.headers.set('x-tenant-host', host);
  
  // Agregar header de seguridad para aislamiento
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');

  return response;
}

// ============================================================================
// CONFIG: Aplica middleware a todas las rutas excepto las ignoradas
// ============================================================================
export const config = {
  matcher: [
    /*
     * RUTAS A PROCESAR:
     * - Todo lo que comienza con /app y sus subrutas
     * - Todo lo que NO empieza con _next, favicon, etc.
     */
    '/((?!_next|favicon|public).*)',
  ],
};
