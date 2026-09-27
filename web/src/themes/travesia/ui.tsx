import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { fmtDec, fmtInt } from '../../../../shared/domain.ts';
import { useApp } from '../../data.tsx';

export function TitleBlock({ k, title, r, rb }: { k: string; title: ReactNode; r?: ReactNode; rb?: ReactNode }) {
  return (
    <header className="tv-titleblock">
      <span className="k">{k}</span>
      <h1>{title}</h1>
      {(r || rb) && <div className="r">{r}{rb && <b>{rb}</b>}</div>}
    </header>
  );
}

export function Sec({ title, aside, id }: { title: string; aside?: ReactNode; id?: string }) {
  return (
    <div className="tv-sec"><h2 id={id}>{title}</h2>{aside != null && <span>{aside}</span>}</div>
  );
}

export function UserBadge() {
  const { profile, email, suggestedName } = useApp();
  const name = profile?.name ?? suggestedName ?? email;
  return (
    <Link to="/perfil" className="tv-user" aria-label={`Perfil de ${name}`}>
      <span>{name}</span>
      <i aria-hidden="true">{(name || '?').slice(0, 1).toUpperCase()}</i>
    </Link>
  );
}

// Campo numérico grande: tocar el número abre el teclado; − / + ajustan por paso.
export function NumField({ label, value, onChange, step, min, max, decimals = 0, unit, hint, small = false, nullable = false, placeholder = '—', start }: {
  label: string; value: number | null; onChange: (v: number | null) => void; step: number; min: number; max: number;
  decimals?: number; unit: string; hint?: ReactNode; small?: boolean; nullable?: boolean; placeholder?: string; start?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) input.current?.select(); }, [editing]);
  const fmt = (v: number) => (decimals ? fmtDec(v, decimals) : fmtInt(v));
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const round = (v: number) => Number(v.toFixed(decimals));
  const bump = (dir: 1 | -1) => {
    if (value == null) { onChange(round(clamp(start ?? min))); return; }
    const next = round(clamp(value + dir * step));
    if (nullable && dir < 0 && value <= min) { onChange(null); return; }
    onChange(next);
  };
  const commit = () => {
    setEditing(false);
    const raw = draft.replace(/\./g, '').replace(',', '.').trim();
    if (!raw) { if (nullable) onChange(null); return; }
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(round(Math.min(max, Math.max(min, n))));
  };
  const id = `tvf-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className={`tv-field${small ? ' sm' : ''}`}>
      <div>
        <label className="lab" htmlFor={id}>{label}</label>
        {editing ? (
          <input id={id} ref={input} className="val" inputMode={decimals ? 'decimal' : 'numeric'} value={draft}
            onChange={(e) => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false); }} />
        ) : (
          <button id={id} type="button" className="val" aria-label={`${label}: ${value == null ? 'sin dato' : `${fmt(value)} ${unit}`}. Tocar para escribir`}
            onClick={() => { setDraft(value == null ? '' : fmt(value).replace(/\./g, '')); setEditing(true); }}>
            {value == null ? <span className="tv-muted">{placeholder}</span> : fmt(value)}<small>{unit}</small>
          </button>
        )}
        {hint && <div className="hint">{hint}</div>}
      </div>
      <div className="tv-step">
        <button type="button" aria-label={`Restar a ${label}`} onClick={() => bump(-1)} disabled={value == null || (!nullable && value <= min)}>−</button>
        <button type="button" className="p" aria-label={`Sumar a ${label}`} onClick={() => bump(1)} disabled={value != null && value >= max}>+</button>
      </div>
    </div>
  );
}

// Botón de doble toque para acciones destructivas.
export function ConfirmButton({ children, confirm, onConfirm, className = 'tv-btn2 danger', disabled }: {
  children: ReactNode; confirm: ReactNode; onConfirm: () => void; className?: string; disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button type="button" className={`${className}${armed ? ' armed' : ''}`} disabled={disabled}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? confirm : children}
    </button>
  );
}

const ICONS = [
  <path key="0" d="M3 21 L11 8 L15 14 L18 10 L23 21Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  <g key="1"><rect x="3" y="3" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M13 8v10M8 13h10" stroke="currentColor" strokeWidth="2" /></g>,
  <path key="2" d="M3 13c3-7 7-9 10-9s7 3 10 9M6 16c2-4 4-6 7-6s5 2 7 6M10 19c1-2 2-3 3-3s2 1 3 3" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  <path key="3" d="M13 23c-5 0-8-3-8-7 0-5 5-7 5-12 3 2 4 5 4 7 1-1 2-2 2-4 3 3 5 6 5 9 0 4-3 7-8 7z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  <path key="4" d="M7 23V3M7 4l13 4-13 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
];
export const TABS: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/', label: 'Hoy', icon: ICONS[0] },
  { to: '/registrar', label: 'Registrar', icon: ICONS[1] },
  { to: '/progreso', label: 'Progreso', icon: ICONS[2] },
  { to: '/quema', label: 'Quema', icon: ICONS[3] },
  { to: '/plan', label: 'Plan', icon: ICONS[4] },
];

export function Mountain() {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true">
      <path d="M4 38 L16 20 L22 27 L30 12 L40 38 Z" fill="#a9c492" stroke="#3a2c1f" strokeWidth="1.4" />
      <path d="M27 17 L30 12 L33 18" fill="#fff" stroke="#3a2c1f" strokeWidth="1.2" />
    </svg>
  );
}

export function Descent() {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true">
      <path d="M4 38 L14 14 L22 22 L40 38 Z" fill="#e6c586" stroke="#3a2c1f" strokeWidth="1.4" />
      <path d="M16 18 L30 34" stroke="#b8382a" strokeWidth="2" strokeDasharray="3 3" />
    </svg>
  );
}
