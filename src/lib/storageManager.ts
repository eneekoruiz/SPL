import imageCompression from "browser-image-compression";
import { auth } from "@/lib/firebase";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dty7oivjy";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ana-peluqueria";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001/api" : "/api")).replace(/\/$/, "");

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.82,
};

const extractPublicId = (url: string): string | null => {
  const uploadPath = url.split("/upload/")[1];
  if (!uploadPath) return null;

  const withoutVersion = uploadPath.replace(/^v\d+\//, "");
  const extensionIndex = withoutVersion.lastIndexOf(".");
  return extensionIndex === -1 ? withoutVersion : withoutVersion.slice(0, extensionIndex);
};

export async function compressAndUpload(file: File, storagePath?: string): Promise<string> {
  let uploadFile: File | Blob = file;
  try {
    uploadFile = await imageCompression(file, COMPRESSION_OPTIONS);
  } catch (error) {
    console.warn("No se pudo comprimir la imagen; se subirá el archivo original.", error);
  }

  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("upload_preset", UPLOAD_PRESET);
  if (storagePath) formData.append("folder", storagePath.split("/")[0]);

  const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
  if (!response.ok) throw new Error("No se pudo subir la imagen.");

  const data = await response.json() as { secure_url?: string };
  if (!data.secure_url) throw new Error("Cloudinary no devolvió una URL válida.");
  return data.secure_url;
}

export async function deleteStorageFile(publicUrl: string): Promise<void> {
  if (!publicUrl.includes("cloudinary.com")) return;

  const publicId = extractPublicId(publicUrl);
  if (!publicId) throw new Error("No se pudo identificar el asset de Cloudinary.");

  const user = auth?.currentUser;
  if (!user) throw new Error("Debes iniciar sesión para eliminar imágenes.");
  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}/admin/delete-asset`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ publicId }),
  });

  if (!response.ok) throw new Error("No se pudo eliminar la imagen.");
}
