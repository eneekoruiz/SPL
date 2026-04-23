/**
 * Core Database Module - Tenant-scoped exports
 * 
 * Patrón de exportación explícito para prevenir importaciones accidentales
 */

export {
  TenantDbFactory,
  ValidatedTenant,
  TENANT_COLLECTIONS,
  createValidatedTenant,
  getTenantDb,
  extractTenantFromheaders,
} from './tenantFactory';

export { firebaseApp, firebaseAuth } from './firebaseAdmin';

export type { TenantCollectionKey, TenantCollectionPath } from './tenantFactory';
