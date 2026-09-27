import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { derive, todayCL, type Derived, type Profile, type Session, type ThemeId, type Weight } from '../../shared/domain.ts';
import { api, ApiError, type ProfileInput, type ProfilePatch, type SessionInput } from './api.ts';
import { clearReauthAttempts } from './reauth.ts';

type Status = 'loading' | 'onboarding' | 'ready' | 'error';

export interface AppData {
  status: Status;
  error: string | null;
  email: string;
  /** Primer nombre sugerido para el onboarding, desde el email. */
  suggestedName: string;
  profile: Profile | null;
  sessions: Session[];
  weights: Weight[];
  /** Todo lo calculado (zonas, pasos, semana, racha, sugerencias, peso…). null hasta tener perfil. */
  d: Derived | null;
  /** Tema activo: el del perfil o, antes del onboarding, el elegido localmente. */
  theme: ThemeId;
  setTheme: (t: ThemeId) => Promise<void>;
  reload: () => Promise<void>;
  createProfile: (p: ProfileInput) => Promise<void>;
  updateProfile: (p: ProfilePatch) => Promise<void>;
  saveSession: (s: SessionInput, id?: number) => Promise<Session>;
  deleteSession: (id: number) => Promise<void>;
  saveWeight: (w: { date: string; kg: number }) => Promise<void>;
  deleteWeight: (id: number) => Promise<void>;
}

const Ctx = createContext<AppData | null>(null);
const THEME_KEY = 'msefitness.theme';

const readLocalTheme = (): ThemeId => {
  try { return localStorage.getItem(THEME_KEY) === 'travesia' ? 'travesia' : 'tablero'; } catch { return 'tablero'; }
};

const msg = (e: unknown) => (e instanceof ApiError ? [e.message, ...e.issues].join(' · ') : 'Error inesperado');

export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [localTheme, setLocalTheme] = useState<ThemeId>(readLocalTheme);
  const [today, setToday] = useState(todayCL);

  const reload = useCallback(async () => {
    try {
      const me = await api.me();
      setEmail(me.email);
      clearReauthAttempts();
      if (!me.profile) { setProfile(null); setStatus('onboarding'); return; }
      const [s, w] = await Promise.all([api.sessions(), api.weights()]);
      setProfile(me.profile);
      setSessions(s);
      setWeights(w);
      setStatus('ready');
      setError(null);
    } catch (e) {
      setError(msg(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  // La app puede quedar abierta días: recalcular "hoy" al volver a primer plano.
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') setToday(todayCL()); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const theme = profile?.theme ?? localTheme;

  const value = useMemo<AppData>(() => {
    const d = profile ? derive(profile, sessions, weights, today) : null;
    const wrap = async <T,>(fn: () => Promise<T>): Promise<T> => {
      try { return await fn(); } catch (e) { throw new Error(msg(e)); }
    };
    return {
      status, error, email, profile, sessions, weights, d, theme,
      suggestedName: (() => { const n = email.split('@')[0].split(/[._\d]/)[0]; return n ? n[0].toUpperCase() + n.slice(1) : ''; })(),
      reload,
      setTheme: async (t) => {
        setLocalTheme(t);
        try { localStorage.setItem(THEME_KEY, t); } catch { /* sin storage */ }
        if (profile) setProfile(await wrap(() => api.updateProfile({ theme: t })));
      },
      createProfile: async (p) => { await wrap(() => api.createProfile(p)); await reload(); },
      updateProfile: async (p) => { setProfile(await wrap(() => api.updateProfile(p))); },
      saveSession: async (s, id) => {
        const saved = await wrap(() => (id ? api.updateSession(id, s) : api.createSession(s)));
        setSessions((xs) => (id ? xs.map((x) => (x.id === id ? saved : x)) : [...xs, saved]));
        return saved;
      },
      deleteSession: async (id) => { await wrap(() => api.deleteSession(id)); setSessions((xs) => xs.filter((x) => x.id !== id)); },
      saveWeight: async (w) => {
        const saved = await wrap(() => api.saveWeight(w));
        setWeights((xs) => [...xs.filter((x) => x.date !== saved.date), saved]);
      },
      deleteWeight: async (id) => { await wrap(() => api.deleteWeight(id)); setWeights((xs) => xs.filter((x) => x.id !== id)); },
    };
  }, [status, error, email, profile, sessions, weights, today, theme, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp fuera de DataProvider');
  return v;
}

/** Para pantallas que solo existen con perfil cargado. */
export function useReady() {
  const app = useApp();
  if (!app.profile || !app.d) throw new Error('useReady sin perfil');
  return { ...app, profile: app.profile, d: app.d };
}
