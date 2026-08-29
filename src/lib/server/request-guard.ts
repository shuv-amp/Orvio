export class RequestGuardError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RequestGuardError";
  }
}

/**
 * CSRF defense for cookie-less JSON POSTs: require Origin and match it to
 * the request URL host. Do not trust the Host header for this comparison.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    throw new RequestGuardError("Origin header required", 403);
  }
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new RequestGuardError("Invalid origin", 403);
  }
  if (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") {
    throw new RequestGuardError("Unsupported origin protocol", 403);
  }
  if (originUrl.host !== new URL(request.url).host) {
    throw new RequestGuardError("Cross-origin request blocked", 403);
  }
}

/** Parse a JSON object with a hard byte cap before schema validation. */
export async function readJsonObject(request: Request, maxBytes = 8_192) {
  assertSameOrigin(request);
  const declared = Number(request.headers.get("content-length") ?? Number.NaN);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new RequestGuardError("Payload too large", 413);
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new RequestGuardError("Payload too large", 413);
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new RequestGuardError("JSON object required", 400);
    }
    return parsed as Record<string, unknown>;
  } catch (error: unknown) {
    if (error instanceof RequestGuardError) throw error;
    throw new RequestGuardError("Invalid JSON", 400);
  }
}
