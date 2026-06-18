import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

const deleteSchema = z.object({
  publicId: z.string().min(1).max(255).regex(/^[a-zA-Z0-9/_-]+$/),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request, "POST, OPTIONS") });
}

export async function POST(request: Request) {
  const headers = getCorsHeaders(request, "POST, OPTIONS");
  const auth = await requireAdminRequest(request);
  if (!auth.authorized) return auth.response;

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid publicId" }, { status: 400, headers });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary configuration missing" }, { status: 500, headers });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${parsed.data.publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const formData = new FormData();
  formData.append("public_id", parsed.data.publicId);
  formData.append("signature", signature);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    return NextResponse.json({ error: "Cloudinary deletion failed" }, { status: 502, headers });
  }

  return NextResponse.json({ success: true }, { headers });
}
