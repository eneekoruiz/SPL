/**
 * TENANT FACTORY PATTERN - Aislamiento Absoluto de Base de Datos
 * 
 * REGLA CRÍTICA: Prohibido acceso global a Firestore.
 * Todo acceso DEBE pasar por esta factory con tenantId obligatorio.
 * 
 * Si intentas acceder a /bookings sin tenantId, TypeScript lanzará ERROR FATAL.
 */

import {
  getFirestore,
  collection,
  CollectionReference,
  DocumentData,
  Query,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  doc,
  Firestore,
} from 'firebase/firestore';

import { firebaseApp } from './firebaseAdmin';

/**
 * Phantom Type para garantizar que solo colecciones "tenant-aware" 
 * pueden ser accedidas. Esto impide acceso accidental.
 */
declare const TenantScopedBrand: unique symbol;
type TenantScoped = { readonly [TenantScopedBrand]: true };

/**
 * Colecciones permitidas en el contexto tenant
 */
export const TENANT_COLLECTIONS = {
  BOOKINGS: 'bookings',
  USERS: 'users',
  APPOINTMENTS: 'appointments',
  INVENTORY: 'inventory',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
} as const;

type TenantCollectionKey = keyof typeof TENANT_COLLECTIONS;
type TenantCollectionPath = (typeof TENANT_COLLECTIONS)[TenantCollectionKey];

/**
 * Tipo que garantiza que el tenantId fue validado
 */
export interface ValidatedTenant extends TenantScoped {
  readonly id: string;
  readonly scope: 'tenant';
}

/**
 * FACTORY FUNCTION: Crear un Tenant Validado
 * 
 * @throws Error si el tenantId no pasa validación
 * @param tenantId - Identificador del tenant
 * @returns ValidatedTenant (Phantom Type para TypeScript)
 */
export function createValidatedTenant(tenantId: string | null | undefined): ValidatedTenant {
  // =========================================================================
  // VALIDACIONES DEFENSIVAS - Cero tolerancia a valores inválidos
  // =========================================================================
  
  // Validación 1: Revisar null/undefined/empty
  if (tenantId === null) {
    const errorMsg = '[TenantFactory] CRITICAL: tenantId is NULL. This indicates a middleware failure or missing x-tenant-id header.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (tenantId === undefined) {
    const errorMsg = '[TenantFactory] CRITICAL: tenantId is UNDEFINED. Ensure middleware injects x-tenant-id header.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (typeof tenantId !== 'string') {
    const errorMsg = `[TenantFactory] CRITICAL: tenantId must be a string, got ${typeof tenantId}. Attempted cross-read attack detected.`;
    console.error(errorMsg, { receivedValue: tenantId });
    throw new Error(errorMsg);
  }

  if (tenantId.trim().length === 0) {
    const errorMsg = '[TenantFactory] CRITICAL: tenantId is empty or whitespace only. Security violation.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Validación 2: Longitud (Prevenir inyección)
  if (tenantId.length < 3 || tenantId.length > 50) {
    const errorMsg = `[TenantFactory] CRITICAL: tenantId length must be 3-50 chars, got ${tenantId.length}. Possible attack vector.`;
    console.error(errorMsg, { tenantId });
    throw new Error(errorMsg);
  }

  // Validación 3: Patrón Regex (Solo alpanuméricos y guiones)
  const TENANT_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
  if (!TENANT_PATTERN.test(tenantId)) {
    const errorMsg = `[TenantFactory] CRITICAL: tenantId "${tenantId}" does not match security pattern. Invalid characters detected.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Validación 4: Sanitización adicional (Trim + lowercase)
  const normalizedTenantId = tenantId.trim().toLowerCase();

  // Validación 5: Re-validar tras normalización
  if (normalizedTenantId !== tenantId.toLowerCase()) {
    const errorMsg = `[TenantFactory] WARNING: tenantId had whitespace or casing issues. Using normalized version.`;
    console.warn(errorMsg, { original: tenantId, normalized: normalizedTenantId });
  }

  // =========================================================================
  // RETORNO SEGURO
  // =========================================================================
  console.debug(`[TenantFactory] ✅ Tenant "${normalizedTenantId}" validated successfully`);

  return {
    id: normalizedTenantId,
    scope: 'tenant',
    [TenantScopedBrand]: true,
  } as ValidatedTenant;
}

/**
 * FACTORY CLASS: Aislamiento de Datos por Tenant
 * 
 * Patrón: Todas las operaciones EXIGEN tenantId como parámetro tipado.
 * Sin tenantId → ERROR EN COMPILACIÓN.
 */
export class TenantDbFactory {
  private firestore: Firestore;
  private tenantId: string;

  private constructor(tenantId: string) {
    // =========================================================================
    // VALIDACIONES DEFENSIVAS EN CONSTRUCTOR
    // =========================================================================
    
    if (!tenantId || typeof tenantId !== 'string') {
      const errorMsg = '[TenantDbFactory] Constructor FAILED: Invalid tenantId type or empty value.';
      console.error(errorMsg, { receivedType: typeof tenantId, value: tenantId });
      throw new Error(errorMsg);
    }

    if (tenantId.trim().length === 0) {
      const errorMsg = '[TenantDbFactory] Constructor FAILED: tenantId is whitespace only.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Re-validar patrón (Defensa en profundidad)
    const TENANT_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
    if (!TENANT_PATTERN.test(tenantId)) {
      const errorMsg = `[TenantDbFactory] Constructor FAILED: tenantId "${tenantId}" fails security pattern validation.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.tenantId = tenantId.toLowerCase();
    this.firestore = getFirestore(firebaseApp);

    console.debug(`[TenantDbFactory] ✅ Factory initialized for tenant "${this.tenantId}"`);
  }

  /**
   * FACTORY METHOD ESTÁTICO: Instanciar con tenant validado
   * 
   * @param tenant - ValidatedTenant (Phantom Type)
   * @returns Instancia de TenantDbFactory
   */
  static forTenant(tenant: ValidatedTenant): TenantDbFactory {
    if (!tenant || !tenant.id) {
      const errorMsg = '[TenantDbFactory.forTenant] CRITICAL: Received null or invalid ValidatedTenant.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    return new TenantDbFactory(tenant.id);
  }

  /**
   * HELPER: Construir ruta de colección tenant-aware (Con validación)
   * 
   * @param collectionPath - Ruta de colección (ej: 'bookings', 'users')
   * @returns Ruta completa: tenants/{tenantId}/{collection}
   */
  private getTenantCollectionPath(collectionPath: TenantCollectionPath): string {
    // Validar que el tenantId no está vacío (Defensa contra manipulación)
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      const errorMsg = '[TenantDbFactory] CRITICAL: tenantId was corrupted or emptied.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Validar que collectionPath está en el enum (Prevenir inyección)
    const allowedCollections = Object.values(TENANT_COLLECTIONS);
    if (!allowedCollections.includes(collectionPath)) {
      const errorMsg = `[TenantDbFactory] CRITICAL: Attempted access to unauthorized collection "${collectionPath}". Possible attack.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const path = `tenants/${this.tenantId}/${collectionPath}`;
    console.debug(`[TenantDbFactory] Building path: ${path}`);
    return path;
  }

  // ==========================================================================
  // OPERACIONES DE LECTURA (Todas tenant-scoped)
  // ==========================================================================

  /**
   * Obtener referencia a colección tenant-scoped
   * 
   * @param collectionPath - Nombre de colección permitida
   * @returns CollectionReference<DocumentData>
   */
  getCollection(
    collectionPath: TenantCollectionPath
  ): CollectionReference<DocumentData> {
    const path = this.getTenantCollectionPath(collectionPath);
    return collection(this.firestore, path);
  }

  /**
   * Obtener referencia a documento específico (Con validación defensiva)
   * 
   * @param collectionPath - Nombre de colección
   * @param docId - ID del documento
   * @returns DocumentReference<DocumentData>
   */
  getDoc(
    collectionPath: TenantCollectionPath,
    docId: string
  ): DocumentReference<DocumentData> {
    // Validación defensiva del docId
    if (!docId || typeof docId !== 'string') {
      const errorMsg = `[TenantDbFactory] CRITICAL: docId must be a non-empty string, got ${typeof docId}.`;
      console.error(errorMsg, { docId });
      throw new Error(errorMsg);
    }

    if (docId.trim().length === 0) {
      const errorMsg = '[TenantDbFactory] CRITICAL: docId cannot be empty or whitespace only.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const path = this.getTenantCollectionPath(collectionPath);
    return doc(this.firestore, path, docId);
  }

  /**
   * Obtener todos los documentos de una colección
   * 
   * @param collectionPath - Nombre de colección
   * @returns Promise<DocumentData[]>
   */
  async getAllDocuments(
    collectionPath: TenantCollectionPath
  ): Promise<DocumentData[]> {
    const ref = this.getCollection(collectionPath);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Obtener documento por ID
   * 
   * @param collectionPath - Nombre de colección
   * @param docId - ID del documento
   * @returns Promise<DocumentData | null>
   */
  async getDocumentById(
    collectionPath: TenantCollectionPath,
    docId: string
  ): Promise<DocumentData | null> {
    const ref = this.getDoc(collectionPath, docId);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  }

  /**
   * Buscar documentos con filtro
   * 
   * @param collectionPath - Nombre de colección
   * @param filters - Array de whereClause
   * @returns Promise<DocumentData[]>
   */
  async queryDocuments(
    collectionPath: TenantCollectionPath,
    filters: Array<ReturnType<typeof where>>
  ): Promise<DocumentData[]> {
    const ref = this.getCollection(collectionPath);
    const q = query(ref, ...filters);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // ==========================================================================
  // OPERACIONES DE ESCRITURA (Todas tenant-scoped)
  // ==========================================================================

  /**
   * Crear documento (Con validación defensiva)
   * 
   * @param collectionPath - Nombre de colección
   * @param docId - ID del documento
   * @param data - Datos a almacenar
   * @returns Promise<void>
   */
  async createDocument(
    collectionPath: TenantCollectionPath,
    docId: string,
    data: DocumentData
  ): Promise<void> {
    // Validaciones defensivas
    if (!data || typeof data !== 'object') {
      const errorMsg = '[TenantDbFactory] CRITICAL: data must be an object for createDocument.';
      console.error(errorMsg, { dataType: typeof data });
      throw new Error(errorMsg);
    }

    console.debug(`[TenantDbFactory] Creating document in ${collectionPath} with ID ${docId} for tenant ${this.tenantId}`);

    const ref = this.getDoc(collectionPath, docId);
    
    // Inyectar tenantId como PROOF of isolation
    const documentWithTenant = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tenantId: this.tenantId, // CRÍTICO: Marca siempre el tenant
    };

    await setDoc(ref, documentWithTenant);
  }

  /**
   * Actualizar documento (Con validación defensiva)
   * 
   * @param collectionPath - Nombre de colección
   * @param docId - ID del documento
   * @param data - Datos a actualizar
   * @returns Promise<void>
   */
  async updateDocument(
    collectionPath: TenantCollectionPath,
    docId: string,
    data: DocumentData
  ): Promise<void> {
    // Validaciones defensivas
    if (!data || typeof data !== 'object') {
      const errorMsg = '[TenantDbFactory] CRITICAL: data must be an object for updateDocument.';
      console.error(errorMsg, { dataType: typeof data });
      throw new Error(errorMsg);
    }

    console.debug(`[TenantDbFactory] Updating document in ${collectionPath} with ID ${docId} for tenant ${this.tenantId}`);

    const ref = this.getDoc(collectionPath, docId);

    // Inyectar updatedAt y tenantId como PROOF of isolation
    const updateWithTenant = {
      ...data,
      updatedAt: new Date().toISOString(),
      tenantId: this.tenantId, // CRÍTICO: Sella el tenant
    };

    await updateDoc(ref, updateWithTenant);
  }

  /**
   * Eliminar documento (Con logging defensivo)
   * 
   * @param collectionPath - Nombre de colección
   * @param docId - ID del documento
   * @returns Promise<void>
   */
  /**
   * Eliminar documento (Con audit logging defensivo)
   * 
   * @param collectionPath - Nombre de colección
   * @param docId - ID del documento
   * @returns Promise<void>
   */
  async deleteDocument(
    collectionPath: TenantCollectionPath,
    docId: string
  ): Promise<void> {
    console.warn(`[TenantDbFactory] AUDIT: Deleting document ${docId} from ${collectionPath} for tenant ${this.tenantId}`);
    
    const ref = this.getDoc(collectionPath, docId);
    await deleteDoc(ref);
  }

  // ==========================================================================
  // HELPER: Acceso a Firestore para queries complejas (con validación)
  // ==========================================================================

  /**
   * Obtener instancia de Firestore (para queries avanzadas)
   * 
   * ⚠️ USO CUIDADOSO: Asegurar que se usa el prefix de tenant.
   * 
   * @returns Instancia de Firestore
   */
  getDb(): Firestore {
    return this.firestore;
  }

  /**
   * Obtener el tenantId actual
   * 
   * @returns ID del tenant
   */
  getTenantId(): string {
    return this.tenantId;
  }
}

/**
 * EXPORT ESTRICTO: Función singleton para acceder a la factory
 * 
 * @param tenant - ValidatedTenant (obtenido de createValidatedTenant)
 * @returns TenantDbFactory instancia
 * 
 * EJEMPLO DE USO:
 * 
 * const tenant = createValidatedTenant(req.headers['x-tenant-id']);
 * const db = getTenantDb(tenant);
 * const bookings = await db.getAllDocuments('bookings');
 */
export function getTenantDb(tenant: ValidatedTenant): TenantDbFactory {
  return TenantDbFactory.forTenant(tenant);
}

/**
 * VALIDATOR: Asegurar que el tenantId viene del middleware (Con validación defensiva)
 * 
 * @param headers - Headers de request
 * @returns ValidatedTenant
 * @throws Error si no hay tenant ID válido
 */
export function extractTenantFromheaders(headers: Record<string, any>): ValidatedTenant {
  // Validación defensiva 1: Verificar que headers es un objeto
  if (!headers || typeof headers !== 'object') {
    const errorMsg = '[TenantFactory] CRITICAL: extractTenantFromheaders received invalid headers object.';
    console.error(errorMsg, { headersType: typeof headers });
    throw new Error(errorMsg);
  }

  // Validación defensiva 2: Obtener tenantId del header
  const tenantId = headers['x-tenant-id'];

  // Validación defensiva 3: Verificar que existe
  if (!tenantId) {
    const errorMsg = '[TenantFactory] CRITICAL: Missing x-tenant-id header. Middleware must inject it into request headers.';
    console.error(errorMsg, { availableHeaders: Object.keys(headers) });
    throw new Error(errorMsg);
  }

  // Validación defensiva 4: Verificar tipo y contenido
  if (typeof tenantId !== 'string') {
    const errorMsg = `[TenantFactory] CRITICAL: x-tenant-id must be a string, got ${typeof tenantId}.`;
    console.error(errorMsg, { receivedValue: tenantId });
    throw new Error(errorMsg);
  }

  console.debug(`[TenantFactory] Extracted tenantId "${tenantId}" from headers`);

  // Validación defensiva 5: Crear ValidatedTenant (realiza todas las validaciones)
  return createValidatedTenant(tenantId);
}
