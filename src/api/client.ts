import { tokenStore } from './tokenStore';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/** Flatten a DRF error body into a single readable message. */
export function extractErrorMessage(payload: unknown, fallback = 'خطایی رخ داد. دوباره تلاش کنید.'): string {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;

  const collect = (value: unknown): string[] => {
    if (value == null) return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(collect);
    if (typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(collect);
    return [String(value)];
  };

  const obj = payload as Record<string, unknown>;
  if (typeof obj.detail === 'string') return obj.detail;

  const messages = collect(payload);
  return messages.length ? messages[0] : fallback;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach the Bearer access token (and refresh-on-401). Default: false. */
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) {
          tokenStore.clear();
          return null;
        }
        const data = (await res.json()) as { access: string };
        tokenStore.setAccess(data.access);
        return data.access;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function rawRequest<T>(path: string, options: RequestOptions, accessToken: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ApiError(extractErrorMessage(data), res.status, data);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const useAuth = options.auth ?? false;
  let access = useAuth ? tokenStore.getAccess() : null;

  try {
    return await rawRequest<T>(path, options, access);
  } catch (err) {
    // On an expired/invalid access token, refresh once and retry.
    if (useAuth && err instanceof ApiError && err.status === 401 && tokenStore.getRefresh()) {
      access = await refreshAccessToken();
      if (access) {
        return rawRequest<T>(path, options, access);
      }
      tokenStore.clear();
    }
    throw err;
  }
}
