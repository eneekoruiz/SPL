const DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
];

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/$/, "");

export const getAllowedOrigins = (): string[] => {
  const configured = (process.env.ALLOWED_ORIGINS ?? "")
    .split(/[\n,]/)
    .map(normalizeOrigin)
    .filter(Boolean);

  if (configured.length > 0) return configured;
  return process.env.NODE_ENV === "production" ? [] : DEVELOPMENT_ORIGINS;
};

export const getCorsHeaders = (
  request: Request,
  methods = "GET, POST, PUT, PATCH, DELETE, OPTIONS",
): Record<string, string> => {
  const origin = normalizeOrigin(request.headers.get("origin") ?? "");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin && getAllowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
};
