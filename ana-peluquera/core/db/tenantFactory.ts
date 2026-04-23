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
export function createValidatedTenant(tenantId: string): ValidatedTenant {
  // Validaciones obligatorias
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('[TenantFactory] tenantId must be a non-empty string');
  }

  if (tenantId.length < 3 || tenantId.length > 50) {
    throw new Error('[TenantFactory] tenantId must be 3-50 characters');
  }

  const TENANT_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
  if (!TENANT_PATTERN.test(tenantId)) {
    throw new Error(
      '[TenantFactory] tenantId must contain only alphanumeric characters and hyphens'
    );
  }

  const normalizedTenantId = tenantId.toLowerCase();

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
    if (!tenantId) {
      throw new Error('[TenantDbFactory] Constructor requires validated tenantId');
    }
    this.tenantId = tenantId;
    this.firestore = getFirestore(firebaseApp);
  }

  /**
   * FACTORY METHOD ESTÁTICO: Instanciar con tenant validado
   * 
   * @param tenant - ValidatedTenant (Phantom Type)
   * @returns Instancia de TenantDbFactory
   */
  static forTenant(tenant: ValidatedTenant): TenantDbFactory {
    return new TenantDbFactory(tenant.id);
  }

  /**
   * HELPER: Construir ruta de colección tenant-aware
   * 
   * @param collectionPath - Ruta de colección (ej: 'bookings', 'users')
   * @returns Ruta completa: tenants/{tenantId}/{collection}
   */
  private getTenantCollectionPath(collectionPath: TenantCollectionPath): string {
    return `tenants/${this.tenantId}/${collectionPath}`;
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
   * Obtener referencia a documento específico
   * 
   * @param collectionPath - Nombre de colección
   * @param docId - ID del documento
   * @returns DocumentReference<DocumentData>
   */
  getDoc(
    collectionPath: TenantCollectionPath,
    docId: string
  ): DocumentReference<DocumentData> {
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
   * Crear documento
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
    const ref = this.getDoc(collectionPath, docId);
    await setDoc(ref, {
      ...data,
      createdAt: new Date().toISOString(),
      tenantId: this.tenantId, // Marca siempre el tenant
    });
  }

  /**
   * Actualizar documento
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
    const ref = this.getDoc(collectionPath, docId);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
      tenantId: this.tenantId,
    });
  }

  /**
   * Eliminar documento
   * 
   * @param collectionPath - Nombre de colección
   * @param docId - ID del documento
   * @returns Promise<void>
   */
  async deleteDocument(
    collectionPath: TenantCollectionPath,
    docId: string
  ): Promise<void> {
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
 * VALIDATOR: Asegurar que el tenantId viene del middleware
 * 
 * @param headers - Headers de request
 * @returns ValidatedTenant
 * @throws Error si no hay tenant ID válido
 */
export function extractTenantFromheaders(headers: Record<string, any>): ValidatedTenant {
  const tenantId = headers['x-tenant-id'];
  if (!tenantId) {
    throw new Error(
      '[TenantFactory] Missing x-tenant-id header. Middleware must inject it.'
    );
  }
  return createValidatedTenant(tenantId);
}
