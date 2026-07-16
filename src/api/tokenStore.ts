import type { AuthUser } from '@/types/api';

export interface AuthState {
  access: string;
  refresh: string;
  user: AuthUser;
}

const STORAGE_KEY = 'nobat.auth';

type Listener = (state: AuthState | null) => void;
const listeners = new Set<Listener>();

let current: AuthState | null = load();

function load(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

function persist(state: AuthState | null) {
  current = state;
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((fn) => fn(state));
}

export const tokenStore = {
  get(): AuthState | null {
    return current;
  },
  getAccess(): string | null {
    return current?.access ?? null;
  },
  getRefresh(): string | null {
    return current?.refresh ?? null;
  },
  set(state: AuthState) {
    persist(state);
  },
  /** Update only the access token (after a refresh). */
  setAccess(access: string) {
    if (current) persist({ ...current, access });
  },
  clear() {
    persist(null);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
