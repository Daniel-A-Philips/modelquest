// Client for the Express API in server/index.ts. In development, Vite forwards
// /api requests to the Express server (see vite.config.ts).
import type { AccessLogEntry, AccessSnapshot, Model, User } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: { method?: string; body?: unknown; userId?: string } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.userId ? { 'X-User-Id': options.userId } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('Can’t reach the server. Check that it’s running with npm run dev.', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? `The server returned an error (${res.status}).`, res.status);
  return data as T;
}

export const api = {
  listUsers: () => request<User[]>('/users'),
  getModel: (id: string) => request<Model>(`/models/${id}`),
  getAccess: (modelId: string) => request<AccessSnapshot>(`/models/${modelId}/access`),
  getLog: (modelId: string) => request<AccessLogEntry[]>(`/models/${modelId}/access/log`),
  saveAccess: (modelId: string, actingUserId: string, next: AccessSnapshot) =>
    request<AccessSnapshot>(`/models/${modelId}/access`, { method: 'PUT', body: next, userId: actingUserId }),
};
