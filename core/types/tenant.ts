/**
 * Core Types - Tenant domain model
 */

export interface TenantConfig {
  tenantId: string;
  name: string;
  brandColor: string;
  fontFamily: string;
  logo?: string;
  favicon?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantContext {
  tenantId: string;
  host: string;
  config?: TenantConfig;
}

export type TenantVariationPoint = {
  primaryColor: string;
  fontFamily: string;
  logo: string;
};
