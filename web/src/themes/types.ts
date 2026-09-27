import type { ComponentType, ReactNode } from 'react';

// Contrato que implementa cada tema. Todas las pantallas leen datos con useApp()/useReady()
// (web/src/data.tsx) y la sesión guiada con useGuided() (web/src/guided.ts); no hay lógica
// de negocio en los temas, solo presentación.
export interface ThemeModule {
  /** Marco de la app: fondo, barra inferior de navegación (Hoy, Registrar, Progreso, Quema, Plan), zona segura. */
  Shell: ComponentType<{ children: ReactNode }>;
  /** Carga inicial y errores (sin perfil todavía, sin Shell). */
  Loading: ComponentType;
  ErrorScreen: ComponentType<{ message: string; onRetry: () => void }>;
  /** Primera vez: nombre, nacimiento, sexo, estatura, peso, plan, nivel de quema, tema. Sin Shell. */
  Onboarding: ComponentType;
  Hoy: ComponentType;
  /** Nuevo registro, o edición si la URL trae ?id=N. Prefill opcional en location.state.prefill (desde la sesión guiada). */
  Registrar: ComponentType;
  /** Gráficos + historial de sesiones (tocar una → /registrar?id=N). */
  Progreso: ComponentType;
  Plan: ComponentType;
  /** Quema de grasa: niveles, iniciar sesión guiada, sugerencia de nivel, peso (registrar pesaje) y tendencia. */
  Quema: ComponentType;
  /** Sesión guiada en curso (/quema/sesion), a pantalla completa, sin barra de navegación. */
  Guiada: ComponentType;
  /** Perfil: datos personales, FCmáx manual, cambio de tema, cambio manual de plan/nivel. */
  Perfil: ComponentType;
}
