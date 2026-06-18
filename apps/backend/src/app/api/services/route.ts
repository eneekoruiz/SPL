import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getCorsHeaders } from "@/lib/cors";

export async function GET(request: Request) {
  const headers = getCorsHeaders(request, "GET, OPTIONS");
  try {
    // 🔍 Esto busca la carpeta "services" en tu Firestore
    const snapshot = await getDb().collection("services").get();
    
    // Convertimos los datos de Firebase en una lista limpia
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(services, { headers });
  } catch (error) {
    console.error("❌ Error al leer Firestore:", error);
    return NextResponse.json({ error: "Error al cargar servicios" }, { status: 500, headers });
  }
}

// IMPORTANTE: Añade esto para que el navegador no bloquee la petición inicial
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request, "GET, OPTIONS") });
}
