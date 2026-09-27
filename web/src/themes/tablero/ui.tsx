import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { fmtDec } from '../../../../shared/domain.ts';
import { useApp } from '../../data.tsx';
import { C, Icon, arc } from './svg.tsx';
import './tablero.css';

const NAV: [string, string, ReactNode][] = [
  ['/', 'Inicio', <><path d="M4 16a8 8 0 1 1 16 0" /><path d="M12 16l4-5" /></>],
  ['/registrar', 'Registrar', <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>],
  ['/progreso', 'Progreso', <path d="M3 18l5-6 4 3 8-9" />],
  ['/quema', 'Quema', <path d="M12 3c3 4 6 6.5 6 11a6 6 0 0 1-12 0c0-2.3 1-4.2 2.6-5.8.3 2 1.3 3.2 2.6 3.7C11 9 11.2 6 12 3z" />],
  ['/plan', 'Plan', <path d="M6 5v14M12 5v14M6 12h12M18 5v7" />],
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="tb">
      <div className="tb-app">
        <main className="tb-main">{children}</main>
      </div>
      <nav className="tb-nav" aria-label="Secciones">
        {NAV.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Pantalla completa sin barra (guiada, onboarding). */
export function Full({ children }: { children: ReactNode }) {
  return <div className="tb"><div className="tb-app"><main className="tb-main tb-full">{children}</main></div></div>;
}

/** Solo el usuario logueado, arriba a la derecha. */
export function Me() {
  const { profile, email } = useApp();
  const name = profile?.name ?? email.split('@')[0];
  return (
    <Link to="/perfil" className="me" aria-label={`Perfil de ${name}`}>
      <i>{name.charAt(0).toUpperCase()}</i><span>{name}</span>
    </Link>
  );
}

export function Who({ kicker, title, right }: { kicker: ReactNode; title: ReactNode; right?: ReactNode }) {
  return (
    <header className="who">
      <h1><small>{kicker}</small>{title}</h1>
      {right === undefined ? <Me /> : right}
    </header>
  );
}

export function Telltale({ on, tone = 'a', icon, blink, children }: { on: boolean; tone?: 'a' | 'g' | 'r'; icon: ReactNode; blink?: boolean; children: ReactNode }) {
  return <span className={`tt${on ? ` ${tone}` : ''}${on && blink ? ' blink' : ''}`}>{icon}{children}</span>;
}

export const parseNum = (s: string) => {
  const n = parseFloat(s.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
const round = (v: number, dec: number) => Math.round(v * 10 ** dec) / 10 ** dec;

/** Perilla − número + ; el número se escribe con el teclado numérico. */
export function Dial({ label, hint, value, onChange, step, min, max, dec = 0, unit, small }: {
  label: string; hint?: ReactNode; value: number; onChange: (v: number) => void; step: number; min: number; max: number; dec?: number; unit: string; small?: boolean;
}) {
  const [text, setText] = useState(fmtDec(value, dec));
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!editing) setText(fmtDec(value, dec)); }, [value, dec, editing]);
  const bump = (d: number) => onChange(round(Math.max(min, Math.min(max, value + d * step)), dec));
  return (
    <div className={`pod dial${small ? ' sm' : ''}`}>
      <div className="lab"><span>{label}</span>{hint && <em>{hint}</em>}</div>
      <button type="button" className="knob" onClick={() => bump(-1)} disabled={value <= min} aria-label={`Bajar ${label}`}>−</button>
      <div className="drum">
        <input
          inputMode={dec ? 'decimal' : 'numeric'} value={text} aria-label={`${label} en ${unit}`}
          onFocus={(e) => { setEditing(true); e.currentTarget.select(); }}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseNum(e.target.value);
            if (!Number.isNaN(n)) onChange(round(Math.max(min, Math.min(max, n)), dec));
          }}
          onBlur={() => { setEditing(false); setText(fmtDec(value, dec)); }}
        />
        <u>{unit}</u>
      </div>
      <button type="button" className="knob" onClick={() => bump(1)} disabled={value >= max} aria-label={`Subir ${label}`}>+</button>
    </div>
  );
}

/** Botón de dos toques para acciones destructivas. */
export function ConfirmButton({ label, confirm, onConfirm, className = 'ghost danger' }: { label: string; confirm: string; onConfirm: () => void; className?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  return (
    <button type="button" className={`${className}${armed ? ' armed' : ''}`} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? confirm : label}
    </button>
  );
}

export function Loading() {
  return (
    <div className="tb">
      <div className="boot" role="status">
        <svg viewBox="0 0 260 200" aria-hidden="true">
          <path d={arc(130, 130, 100, -135, 135)} stroke="#24272b" strokeWidth={10} fill="none" />
          <path d={arc(130, 130, 100, 108, 135)} stroke={C.red} strokeWidth={10} fill="none" />
          <g className="sweep"><path d="M128 140 L129 40 L131 40 L132 140 Z" fill={C.needle} /></g>
          <circle cx={130} cy={130} r={10} fill="#24272b" stroke="#3a3e44" />
        </svg>
        <div className="lab">Encendiendo instrumentos…</div>
      </div>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="tb">
      <div className="boot">
        <span className="tt r">{Icon.heart}Falla</span>
        <p className="note" style={{ maxWidth: 300 }}>{message}</p>
        <button type="button" className="go" style={{ maxWidth: 260 }} onClick={onRetry}>Reintentar</button>
      </div>
    </div>
  );
}
