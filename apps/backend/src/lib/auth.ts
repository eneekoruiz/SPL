import { NextResponse } from "next/server";
import { requireAdminFromIdToken } from "./firebaseAdmin";

export const requireAdminRequest = async (request: Request) => {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const user = await requireAdminFromIdToken(match[1]);
    return { authorized: true as const, user };
  } catch (error) {
    console.warn("Acceso administrativo rechazado.", error);
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
};
