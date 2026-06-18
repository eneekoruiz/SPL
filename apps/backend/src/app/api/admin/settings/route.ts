import { NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin';
import { requireAdminRequest } from '@/lib/auth';
import { getCorsHeaders } from '@/lib/cors';

// ✅ Configuramos CORS para que tu web (puerto 8080) pueda leer estos datos
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request, 'GET, OPTIONS') });
}

/**
 * GET: Devuelve la configuración global del admin (como el email oficial)
 */
export async function GET(request: Request) {
  const headers = getCorsHeaders(request, 'GET, OPTIONS');
  const auth = await requireAdminRequest(request);
  if (!auth.authorized) return auth.response;

  try {
    const db = getFirebaseAdminApp().firestore();
    
    // 🔍 Leemos el documento que creaste en la consola de Firebase
    const adminDoc = await db.collection('settings').doc('admin').get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: 'Configuración no encontrada en Firestore' }, 
        { status: 404, headers }
      );
    }

    const data = adminDoc.data();

    // Devolvemos el email para que el frontend sepa quién manda
    return NextResponse.json({
      email: data?.email,
      // Aquí puedes añadir más cosas en el futuro (ej: teléfono del salón)
    }, { 
      status: 200, 
      headers
    });

  } catch (error) {
    console.error("❌ Error al obtener settings:", error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500, headers }
    );
  }
}
