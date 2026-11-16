// The one place that talks to the backend. Every endpoint goes through request(),
// so errors always come back the same way.

// A failed request. `field` is set when the backend rejected one input
// (422 { field, message }); otherwise it was the server or the network.
export class ApiError extends Error {
  readonly status: number;
  readonly field?: string;

  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.field = field;
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  // fetch itself throws on a network failure (backend down, offline); an
  // AbortError (a newer request replaced this one) is passed through untouched.
  const res = await fetch(path, init);
  if (res.ok) return (await res.json()) as T;

  // The backend sends { message } or { field, message }; anything else (say, the
  // dev proxy's own error page when the backend isn't running) gets a plain message.
  const data = (await res.json().catch(() => null)) as { field?: string; message?: string } | null;
  throw new ApiError(data?.message ?? 'Request failed.', res.status, data?.field);
}

// GET with query parameters; undefined values are left out of the address.
export function getJson<T>(path: string, params: Record<string, string | undefined>, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) query.set(name, value);
  }
  const search = query.toString();
  return request<T>(search ? `${path}?${search}` : path, { signal });
}

export function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}
