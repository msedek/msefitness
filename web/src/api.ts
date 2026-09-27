import type { Profile, Session, Weight } from '../../shared/domain.ts';
import { triggerReauth } from './reauth.ts';

export class ApiError extends Error {
  status: number;
  issues: string[];
  constructor(status: number, message: string, issues: string[] = []) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      redirect: 'manual',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Sin conexión con el servidor');
  }
  // Access vencido: redirect (opaqueredirect), 401, o una página HTML en vez de JSON.
  const html = (res.headers.get('content-type') ?? '').includes('text/html');
  if (res.type === 'opaqueredirect' || res.status === 401 || html) {
    if (!triggerReauth(`api ${res.status}`)) throw new ApiError(401, 'La sesión expiró. Cierra y vuelve a abrir la app.');
    return new Promise<T>(() => {}); // la página se está recargando
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Error ${res.status}`, data.issues);
  return data as T;
}

export interface Me { email: string; profile: Profile | null; today: string }
export type ProfileInput = Omit<Profile, 'email' | 'planSince' | 'grasaSince' | 'planDismissedAt' | 'grasaDismissedAt'> & { weightKg?: number };
export type ProfilePatch = Partial<Omit<ProfileInput, 'weightKg'>> & { dismiss?: 'plan' | 'grasa' };
export type SessionInput = Omit<Session, 'id'>;

export const api = {
  me: () => call<Me>('GET', '/me'),
  createProfile: (p: ProfileInput) => call<Profile>('POST', '/me', p),
  updateProfile: (p: ProfilePatch) => call<Profile>('PATCH', '/me', p),
  sessions: () => call<Session[]>('GET', '/sessions'),
  createSession: (s: SessionInput) => call<Session>('POST', '/sessions', s),
  updateSession: (id: number, s: SessionInput) => call<Session>('PUT', `/sessions/${id}`, s),
  deleteSession: (id: number) => call<void>('DELETE', `/sessions/${id}`),
  weights: () => call<Weight[]>('GET', '/weights'),
  saveWeight: (w: { date: string; kg: number }) => call<Weight>('POST', '/weights', w),
  deleteWeight: (id: number) => call<void>('DELETE', `/weights/${id}`),
};
