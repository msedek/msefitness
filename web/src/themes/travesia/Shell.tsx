import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { ContourMark } from './charts.tsx';
import { TABS, UserBadge } from './ui.tsx';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="tv tv-app">
      <div className="tv-top">
        <span className="tv-brand"><b>msefitness</b> · travesía</span>
        <UserBadge />
      </div>
      <main className="tv-content">{children}</main>
      <nav className="tv-tabbar" aria-label="Secciones">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <svg viewBox="0 0 26 26" aria-hidden="true">{t.icon}</svg>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function Loading() {
  return (
    <div className="tv tv-center" role="status" aria-live="polite">
      <div className="box">
        <ContourMark />
        <h1>Trazando la carta…</h1>
      </div>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="tv tv-center">
      <div className="box">
        <ContourMark size={96} />
        <h1>Se perdió la señal</h1>
        <p className="tv-note">{message}</p>
        <button type="button" className="tv-cta" onClick={onRetry}>Reintentar</button>
      </div>
    </div>
  );
}
