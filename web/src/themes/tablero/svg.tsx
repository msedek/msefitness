import { useId, type ReactNode } from 'react';
import { fmtDec, fmtInt, type Block, type Zone } from '../../../../shared/domain.ts';

// Instrumentos del Tablero en SVG. Ángulos en grados, 0 = arriba, sentido horario.

export const C = {
  ink: '#ece6d8', ink2: '#a9a498', tick: '#6c7078', dim: '#3a3e44', amber: '#ffae1f', red: '#ff3b24',
  redTxt: '#ff5a44', green: '#3ddc8a', needle: '#ff5a2a', bg: '#0b0c0e', rim: '#23262a',
};
export const ZONE_COLOR: Record<Zone, string> = { 1: '#5d6168', 2: C.green, 3: C.amber, 4: C.red, 5: C.red };

export function P(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
export function arc(cx: number, cy: number, r: number, d1: number, d2: number) {
  const [x1, y1] = P(cx, cy, r, d1);
  const [x2, y2] = P(cx, cy, r, d2);
  return `M${x1} ${y1}A${r} ${r} 0 ${Math.abs(d2 - d1) > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}
const clamp = (v: number, a: number, z: number) => Math.max(a, Math.min(z, v));

function useGlow() {
  const id = `tbg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const defs = (
    <defs>
      <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
  return { defs, url: `url(#${id})` };
}

const T = (p: { x: number; y: number; size: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; lab?: boolean; weight?: number; stretch?: string; children: ReactNode; ls?: string }) => (
  <text x={p.x} y={p.y} textAnchor={p.anchor ?? 'middle'} fontFamily={p.lab ? 'Michroma' : 'Saira'} fontSize={p.size}
    fontWeight={p.weight} fontStretch={p.stretch} fill={p.fill ?? C.ink} letterSpacing={p.lab ? p.ls ?? '.1em' : undefined}>{p.children}</text>
);

function Needle({ cx, cy, len, deg, color = C.needle, w = 3, tail = 10, glow, ghost }: { cx: number; cy: number; len: number; deg: number; color?: string; w?: number; tail?: number; glow?: string; ghost?: boolean }) {
  return (
    <g className="needle" filter={ghost ? undefined : glow} opacity={ghost ? 0.35 : 1}
      style={{ transform: `rotate(${deg}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform .6s cubic-bezier(.3,1.5,.5,1)' }}>
      <path d={`M${cx - w / 2} ${cy + tail} L${cx - w * 0.28} ${cy - len} L${cx + w * 0.28} ${cy - len} L${cx + w / 2} ${cy + tail} Z`} fill={color} />
    </g>
  );
}
const Cap = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <><circle cx={cx} cy={cy} r={r + 3} fill="#050506" /><circle cx={cx} cy={cy} r={r} fill="#24272b" stroke="#3a3e44" /></>
);

/* ---------- tacómetro de pasos (0–10.000) ---------- */
export function Tach({ steps, target, readout, sub, subColor, foot }: { steps: number | null; target: number; readout: string; sub: string; subColor: string; foot: string }) {
  const { defs, url } = useGlow();
  const cx = 170, cy = 136, R = 108, V = (v: number) => -135 + 270 * v / 10;
  const val = steps == null ? 0 : clamp(steps / 1000, 0, 10.3);
  const t = target / 1000;
  const ticks: ReactNode[] = [];
  for (let i = 0; i <= 50; i++) {
    const v = i / 5, maj = i % 5 === 0;
    const [x1, y1] = P(cx, cy, R, V(v)); const [x2, y2] = P(cx, cy, R - (maj ? 16 : 6), V(v));
    ticks.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={v >= 9 ? '#ff6a55' : maj ? C.ink : C.tick} strokeWidth={maj ? 2.4 : 1.1} />);
    if (maj) { const [tx, ty] = P(cx, cy, R - 30, V(v)); ticks.push(<T key={`t${i}`} x={tx} y={ty + 6} size={17} weight={600} stretch="75%" fill={v >= 9 ? C.redTxt : C.ink}>{v}</T>); }
  }
  const [mx, my] = P(cx, cy, R + 4, V(t)); const [m2x, m2y] = P(cx, cy, R + 14, V(t) - 3); const [m3x, m3y] = P(cx, cy, R + 14, V(t) + 3);
  // El rótulo va del lado de adentro del arco para no salirse del instrumento cerca del tope.
  const high = t >= 8.5;
  const [lx, ly] = P(cx, cy, high ? R + 20 : R + 24, V(t) + (high ? -18 : t > 5 ? 9 : -9));
  return (
    <svg viewBox="0 0 340 250" role="img" aria-label={`Pasos equivalentes de la última sesión: ${readout}. Meta ${fmtInt(target)}.`} style={{ width: '100%', display: 'block' }}>
      {defs}
      <circle cx={cx} cy={cy} r={R + 8} fill={C.bg} stroke={C.rim} strokeWidth={1.5} />
      <path d={arc(cx, cy, R - 6, V(9), V(10))} stroke={C.red} strokeWidth={10} fill="none" opacity={0.9} />
      {val > 0 && <path d={arc(cx, cy, R - 6, V(0), V(Math.min(val, 10)))} stroke={C.amber} strokeWidth={3} fill="none" opacity={0.35} />}
      {ticks}
      <path d={`M${mx} ${my}L${m2x} ${m2y}L${m3x} ${m3y}Z`} fill={C.amber} filter={url} />
      <T x={lx} y={ly} size={7} lab fill={C.amber} anchor={t > 5 ? 'start' : 'end'}>META</T>
      <T x={cx} y={cy - 52} size={7} lab fill={C.tick} ls=".16em">PASOS EQ × 1000</T>
      <rect x={cx - 50} y={cy + 28} width={100} height={50} rx={8} fill="#050506" stroke="#1d2024" />
      <T x={cx} y={cy + 63} size={36} weight={700} stretch="62%">{readout}</T>
      <T x={cx} y={cy + 74} size={6.5} lab fill={subColor} ls=".12em">{sub}</T>
      <T x={cx} y={cy + 100} size={6.5} lab fill={C.tick} ls=".12em">{foot}</T>
      {steps != null && <Needle cx={cx} cy={cy} len={R - 8} deg={V(val)} glow={url} w={4.5} tail={18} />}
      <Cap cx={cx} cy={cy} r={11} />
    </svg>
  );
}

/* ---------- medidor chico (combustible / temperatura) ---------- */
export function SmallGauge({ min, max, val, ticks, labels, red, color, valText, sub, label }: {
  min: number; max: number; val: number | null; ticks: number[]; labels: Record<number, string>; red?: [number, number]; color?: string; valText: string; sub: string; label: string;
}) {
  const { defs, url } = useGlow();
  const cx = 75, cy = 62, R = 48, V = (v: number) => -70 + 140 * (clamp(v, min, max) - min) / (max - min);
  return (
    <svg viewBox="0 0 150 100" role="img" aria-label={`${label}: ${valText}`} style={{ width: '100%', display: 'block' }}>
      {defs}
      <path d={arc(cx, cy, R, -70, 70)} stroke="#24272b" fill="none" />
      {red && <path d={arc(cx, cy, R - 4, V(red[0]), V(red[1]))} stroke={C.red} strokeWidth={6} fill="none" opacity={0.85} />}
      {color && val != null && val > min && <path d={arc(cx, cy, R - 4, V(min), V(val))} stroke={color} strokeWidth={6} fill="none" filter={url} />}
      {ticks.map((v) => { const [x1, y1] = P(cx, cy, R, V(v)); const [x2, y2] = P(cx, cy, R - (labels[v] != null ? 12 : 7), V(v)); return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9a968c" strokeWidth={1.3} />; })}
      {Object.entries(labels).map(([v, t]) => { const [tx, ty] = P(cx, cy, R + 9, V(+v)); return <T key={v} x={tx} y={ty + 3} size={9} weight={600} fill="#8a867d">{t}</T>; })}
      <T x={cx} y={cy + 24} size={22} weight={700} stretch="62%">{valText}</T>
      <T x={cx} y={cy + 34} size={5.8} lab fill="#8a867d">{sub}</T>
      {val != null && <Needle cx={cx} cy={cy} len={R - 6} deg={V(val)} glow={url} w={3} tail={6} />}
      <Cap cx={cx} cy={cy} r={5} />
    </svg>
  );
}

/* ---------- mini tacómetro de la vista previa ---------- */
export function MiniTach({ steps, target }: { steps: number; target: number }) {
  const { defs, url } = useGlow();
  const cx = 64, cy = 62, R = 50, V = (v: number) => -120 + 240 * v / 10;
  const out: ReactNode[] = [];
  for (let i = 0; i <= 20; i++) {
    const v = i / 2, maj = i % 2 === 0;
    const [x1, y1] = P(cx, cy, R, V(v)); const [x2, y2] = P(cx, cy, R - (maj ? 9 : 5), V(v));
    out.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={v >= 9 ? '#ff6a55' : maj ? C.ink : C.tick} strokeWidth={maj ? 1.8 : 1} />);
    if (maj && v % 2 === 0) { const [tx, ty] = P(cx, cy, R - 17, V(v)); out.push(<T key={`t${i}`} x={tx} y={ty + 3.5} size={10} weight={600} fill="#bdb8ab">{v}</T>); }
  }
  const t = target / 1000;
  const [mx, my] = P(cx, cy, R + 3, V(t)); const [a, b] = P(cx, cy, R + 10, V(t) - 5); const [c, d] = P(cx, cy, R + 10, V(t) + 5);
  return (
    <svg viewBox="0 0 128 100" aria-hidden="true" style={{ width: '100%', maxWidth: 128, display: 'block' }}>
      {defs}
      <path d={arc(cx, cy, R - 3, V(9), V(10))} stroke={C.red} strokeWidth={5} fill="none" />
      {out}
      <path d={`M${mx} ${my}L${a} ${b}L${c} ${d}Z`} fill={C.amber} />
      <T x={cx} y={cy + 30} size={5.5} lab fill={C.tick}>× 1000</T>
      <Needle cx={cx} cy={cy} len={R - 6} deg={V(clamp(steps / 1000, 0, 10.3))} glow={url} w={3} tail={8} />
      <Cap cx={cx} cy={cy} r={5} />
    </svg>
  );
}

/* ---------- tacógrafo: un rayo por sesión ---------- */
export function Disc({ values, target }: { values: number[]; target: number }) {
  const { defs, url } = useGlow();
  const cx = 85, cy = 85, r0 = 24, R = 80, rad = (v: number) => r0 + (R - r0) * Math.min(v, 10500) / 10500, n = values.length;
  const gap = n > 40 ? 0.4 : n > 20 ? 1 : 2;
  return (
    <svg viewBox="0 0 170 170" role="img" aria-label={`Tacógrafo de ${n} sesiones`} style={{ width: '100%', maxWidth: 170, display: 'block' }}>
      {defs}
      <circle cx={cx} cy={cy} r={R + 3} fill={C.bg} stroke={C.rim} />
      {[2500, 5000].map((v) => <circle key={v} cx={cx} cy={cy} r={rad(v)} fill="none" stroke={C.rim} strokeWidth={0.8} />)}
      {values.map((v, i) => {
        const a = i * 360 / n + gap, b = (i + 1) * 360 / n - gap, r = rad(v);
        const [x1, y1] = P(cx, cy, r0, a); const [x2, y2] = P(cx, cy, r, a); const [x3, y3] = P(cx, cy, r, b); const [x4, y4] = P(cx, cy, r0, b);
        const hit = v / target >= 0.9;
        return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}A${r} ${r} 0 0 1 ${x3} ${y3}L${x4} ${y4}A${r0} ${r0} 0 0 0 ${x1} ${y1}Z`} fill={hit ? C.amber : '#8a6a2a'} opacity={hit ? 1 : 0.75} />;
      })}
      <circle cx={cx} cy={cy} r={rad(target)} fill="none" stroke={C.amber} strokeWidth={1.4} strokeDasharray="2 2" filter={url} />
      <circle cx={cx} cy={cy} r={rad(10000)} fill="none" stroke={C.red} strokeWidth={1.6} />
      <circle cx={cx} cy={cy} r={r0 - 2} fill="#050506" stroke="#2a2e33" />
      <T x={cx} y={cy + 2} size={15} weight={700} stretch="62%">{n}</T>
      <T x={cx} y={cy + 10} size={4.5} lab fill="#8a867d" ls=".08em">SESIONES</T>
      <path d={`M${cx} ${cy - R + 4}l-3 -6h6z`} fill={C.ink} />
    </svg>
  );
}

/* ---------- osciloscopio de pulso ---------- */
export function Scope({ values, alert, first, last }: { values: number[]; alert: number; first: string; last: string }) {
  const { defs, url } = useGlow();
  const x0 = 34, x1 = 330, y0 = 10, y1 = 80;
  const lo = Math.floor((Math.min(...values) - 4) / 5) * 5;
  const hiData = Math.max(...values) + 4;
  const showAlert = alert <= hiData + 12;
  const hi = Math.ceil(Math.max(hiData, showAlert ? alert + 3 : 0) / 5) * 5;
  const n = values.length;
  const X = (i: number) => (n === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * i / (n - 1));
  const Y = (v: number) => y1 - (y1 - y0) * (v - lo) / (hi - lo);
  const step = hi - lo > 30 ? 10 : 5;
  const grid: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) grid.push(v);
  return (
    <svg viewBox="0 0 340 94" role="img" aria-label={`Pulso promedio por sesión, de ${values[0]} a ${values[n - 1]} lpm`} style={{ width: '100%', display: 'block' }}>
      {defs}
      {Array.from({ length: 9 }, (_, i) => { const x = x0 + (x1 - x0) * i / 8; return <line key={i} x1={x} y1={y0} x2={x} y2={y1} stroke="#1c1f22" />; })}
      {grid.map((v) => <g key={v}><line x1={x0} y1={Y(v)} x2={x1} y2={Y(v)} stroke="#1c1f22" /><T x={x0 - 6} y={Y(v) + 3} size={9} anchor="end" fill={C.tick}>{v}</T></g>)}
      {showAlert && <>
        <line x1={x0} y1={Y(alert)} x2={x1} y2={Y(alert)} stroke={C.red} strokeDasharray="3 3" />
        <T x={x1 - 2} y={Y(alert) - 4} size={5.5} lab anchor="end" fill={C.redTxt}>{`ALERTA ${alert} LPM · 85 % FCMÁX`}</T>
      </>}
      {n > 1 && <polyline points={values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} fill="none" stroke={C.amber} strokeWidth={2} strokeLinejoin="round" filter={url} />}
      <circle cx={X(n - 1)} cy={Y(values[n - 1])} r={3.5} fill={C.amber} filter={url} />
      <T x={x0} y={y1 + 12} size={5.5} lab anchor="start" fill={C.tick}>{first}</T>
      <T x={x1} y={y1 + 12} size={5.5} lab anchor="end" fill={C.tick}>{last}</T>
    </svg>
  );
}

/* ---------- eficiencia: aguja fantasma (primera) y actual ---------- */
export function EffGauge({ first, last }: { first: number; last: number }) {
  const { defs, url } = useGlow();
  const lo = Math.floor(Math.min(first, last) * 10 - 1) / 10, hi = Math.ceil(Math.max(first, last) * 10 + 1) / 10;
  const min = Math.min(lo, hi - 0.6), max = Math.max(hi, lo + 0.6);
  const cx = 80, cy = 70, R = 54, V = (v: number) => -80 + 160 * (v - min) / (max - min);
  const ticks: ReactNode[] = [];
  const nT = Math.round((max - min) / 0.05);
  for (let i = 0; i <= nT; i++) {
    const v = min + i * 0.05, maj = i % 2 === 0;
    const [x1, y1] = P(cx, cy, R, V(v)); const [x2, y2] = P(cx, cy, R - (maj ? 10 : 5), V(v));
    ticks.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={maj ? '#bdb8ab' : '#55585e'} strokeWidth={maj ? 1.5 : 1} />);
    if (maj && i % 4 === 0) { const [tx, ty] = P(cx, cy, R + 9, V(v)); ticks.push(<T key={`t${i}`} x={tx} y={ty + 3} size={8.5} weight={600} fill="#8a867d">{fmtDec(v, 1)}</T>); }
  }
  const up = last >= first;
  return (
    <svg viewBox="0 0 160 96" role="img" aria-label={`Eficiencia: de ${fmtDec(first, 2)} a ${fmtDec(last, 2)} metros por latido`} style={{ width: '100%', display: 'block' }}>
      {defs}
      <path d={arc(cx, cy, R - 4, V(Math.min(first, last)), V(Math.max(first, last)))} stroke={up ? C.green : C.red} strokeWidth={5} fill="none" opacity={0.8} filter={url} />
      {ticks}
      <Needle cx={cx} cy={cy} len={R - 8} deg={V(first)} color={C.ink} w={2.4} tail={6} ghost />
      <Needle cx={cx} cy={cy} len={R - 8} deg={V(last)} glow={url} w={3} tail={6} />
      <Cap cx={cx} cy={cy} r={5} />
      <T x={cx} y={cy + 20} size={18} weight={700} stretch="62%">{fmtDec(last, 2)}</T>
    </svg>
  );
}

/* ---------- odómetro de tambor ---------- */
export function Odo({ km, digits = 5 }: { km: number; digits?: number }) {
  const [a, b] = fmtDec(km, 1).replace(/\./g, '').split(',');
  const whole = a.padStart(digits, '0').slice(-Math.max(digits, a.length));
  return (
    <div className="odo" role="img" aria-label={`${fmtDec(km, 1)} kilómetros`}>
      {[...whole].map((c, i) => <b key={i}>{c}</b>)}<i>,</i><b className="tenth">{b}</b><em>KM</em>
    </div>
  );
}

/* ---------- caja de cambios ---------- */
const GEARS: [number, number][] = [[36, 26], [36, 94], [70, 26]];
export function Gate({ current, target }: { current: number; target: number | null }) {
  const { defs, url } = useGlow();
  const [cx, cy] = GEARS[current];
  const path = target == null ? null : (() => { const [tx, ty] = GEARS[target]; return `M${cx} ${cy + (cy > 60 ? -2 : 2)}V60H${tx}V${ty + (ty > 60 ? -2 : 2)}`; })();
  return (
    <svg viewBox="0 0 140 120" role="img" aria-label={`Marcha actual ${current + 1}${target != null ? `, sugerida ${target + 1}` : ''}`} style={{ width: '100%', maxWidth: 140, display: 'block' }}>
      {defs}
      <rect x={2} y={2} width={136} height={116} rx={14} fill="#0a0b0c" stroke={C.rim} />
      <path d="M36 26V94M36 60H104M70 26V60M104 26V60" stroke="#1f2226" strokeWidth={14} strokeLinecap="round" fill="none" />
      <path d="M36 26V94M36 60H104M70 26V60M104 26V60" stroke="#050506" strokeWidth={8} strokeLinecap="round" fill="none" />
      {path && <path className="blink" d={path} stroke={C.amber} strokeWidth={1.6} fill="none" strokeDasharray="3 3" filter={url} />}
      {[[36, 14, '1'], [36, 112, '2'], [70, 14, '3'], [104, 14, 'R']].map(([x, y, t], i) => (
        <T key={t as string} x={x as number} y={(y as number) + 3} size={12} weight={700} fill={i === current ? C.amber : i === target ? C.ink : t === 'R' ? C.dim : '#8a867d'}>{t}</T>
      ))}
      <circle cx={cx} cy={cy} r={11} fill="#2a2d31" stroke={C.amber} strokeWidth={1.5} filter={url} />
      <circle cx={cx - 3} cy={cy - 3} r={3.5} fill="#ffffff22" />
    </svg>
  );
}

/* ---------- sparkline ---------- */
export function Spark({ values, bars, threshold, color = C.amber }: { values: number[]; bars?: boolean; threshold?: number; color?: string }) {
  if (values.length < 2) return <svg width={60} height={22} aria-hidden="true" />;
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  if (bars) {
    const w = 60 / values.length;
    return (
      <svg viewBox="0 0 60 22" width={60} height={22} aria-hidden="true">
        {values.map((v, i) => { const h = 3 + 17 * clamp((v - 0.5) / 0.7, 0, 1); return <rect key={i} x={i * w + 0.5} y={21 - h} width={Math.max(1, w - 2)} height={h} fill={threshold != null && v >= threshold ? C.amber : '#4a4d52'} />; })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 22" width={60} height={22} aria-hidden="true">
      <polyline points={values.map((v, i) => `${i * 60 / (values.length - 1)},${20 - 18 * (v - lo) / span}`).join(' ')} fill="none" stroke={color} strokeWidth={1.4} />
    </svg>
  );
}

/* ---------- perfil de bloques de una sesión guiada ---------- */
const BLOCK_H: Record<Zone, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4 };
const blockH = (b: Block) => (b.label === 'Z3 alto' ? 3.6 : BLOCK_H[b.zone]);

export function BlockProfile({ blocks, width = 112, height = 30, scaleMin, current, cursorSec, axis, label }: {
  blocks: Block[]; width?: number; height?: number; scaleMin?: number; current?: number; cursorSec?: number; axis?: boolean; label?: string;
}) {
  const showAxis = axis || cursorSec != null;
  const { defs, url } = useGlow();
  const tot = blocks.reduce((a, b) => a + b.minutes, 0);
  const scale = scaleMin ?? tot;
  const base = height - 2, H = height - 6;
  let x = 0;
  return (
    <svg viewBox={`0 0 ${width} ${height + (showAxis ? 12 : 0)}`} role="img" aria-label={label ?? `Perfil de ${tot} minutos`} style={{ width: '100%', display: 'block' }}>
      {defs}
      {showAxis && [1, 2, 3, 4].map((z) => <line key={z} x1={0} x2={width} y1={base - H * z / 4} y2={base - H * z / 4} stroke="#1a1c1f" />)}
      {blocks.map((b, i) => {
        const w = width * b.minutes / scale, h = H * blockH(b) / 4;
        const el = <rect key={i} x={x + 0.6} y={base - h} width={Math.max(w - 1.2, 0.8)} height={h} rx={1.2} fill={ZONE_COLOR[b.zone]}
          opacity={current == null ? 0.9 : i < current ? 0.35 : i === current ? 1 : 0.8} filter={i === current ? url : undefined} />;
        x += w;
        return el;
      })}
      {cursorSec != null && (() => {
        const cxp = width * Math.min(cursorSec / 60, tot) / scale;
        return <>
          <line x1={cxp} x2={cxp} y1={0} y2={base + 3} stroke={C.ink} strokeWidth={1.5} filter={url} />
          <path d={`M${cxp - 5} 0h10l-5 6z`} fill={C.ink} />
        </>;
      })()}
      {showAxis && <>
        <T x={0} y={height + 10} size={6} lab anchor="start" fill={C.tick}>0:00</T>
        <T x={width} y={height + 10} size={6} lab anchor="end" fill={C.tick}>{`${tot}:00`}</T>
      </>}
    </svg>
  );
}

/* ---------- velocímetro de crucero (pulso vs rango del bloque) ---------- */
export function Cruise({ fcmax, band, hr, status }: { fcmax: number; band: [number, number]; hr: number | null; status: string | null }) {
  const { defs, url } = useGlow();
  const min = Math.floor(fcmax * 0.5 / 10) * 10, max = Math.ceil(fcmax * 0.92 / 10) * 10;
  const cx = 75, cy = 70, R = 56, V = (v: number) => -110 + 220 * (clamp(v, min, max) - min) / (max - min);
  const zb = [0.5, 0.6, 0.7, 0.8, 0.9].map((f) => Math.round(fcmax * f));
  const bands: [number, number, string][] = [[min, zb[1], '#3a3e44'], [zb[1], zb[2], '#1f6b45'], [zb[2], zb[3], '#6b4a10'], [zb[3], max, '#5a1a12']];
  const col = status === 'en zona' ? C.green : status ? C.amber : C.tick;
  return (
    <svg viewBox="0 0 150 116" role="img" aria-label={`Rango objetivo ${band[0]} a ${band[1]} lpm${hr ? `, pulso ${hr}` : ''}`} style={{ width: '100%', display: 'block' }}>
      {defs}
      {bands.map(([a, b, c]) => <path key={a} d={arc(cx, cy, R - 5, V(a), V(b))} stroke={c} strokeWidth={8} fill="none" />)}
      <path d={arc(cx, cy, R - 5, V(band[0]), V(band[1]))} stroke={C.amber} strokeWidth={8} fill="none" filter={url} />
      {zb.slice(1, 4).concat([min]).map((v) => {
        const [x1, y1] = P(cx, cy, R, V(v)); const [x2, y2] = P(cx, cy, R - 11, V(v)); const [tx, ty] = P(cx, cy, R + 8, V(v));
        return <g key={v}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bdb8ab" strokeWidth={1.2} /><T x={tx} y={ty + 3} size={8.5} weight={600} fill="#8a867d">{v}</T></g>;
      })}
      {hr != null && <Needle cx={cx} cy={cy} len={R - 4} deg={V(hr)} glow={url} w={3} tail={8} />}
      <Cap cx={cx} cy={cy} r={6} />
      <T x={cx} y={cy + 30} size={24} weight={700} stretch="62%">{hr != null ? `${hr} lpm` : `${band[0]}–${band[1]}`}</T>
      <T x={cx} y={cy + 41} size={5.5} lab fill={col}>{status ? status.toUpperCase() : 'RANGO DEL BLOQUE · LPM'}</T>
    </svg>
  );
}

/* ---------- peso con media móvil ---------- */
export function WeightChart({ points }: { points: { date: string; kg: number; avg: number }[] }) {
  const { defs, url } = useGlow();
  const x0 = 30, x1 = 330, y0 = 8, y1 = 56, n = points.length;
  const vals = points.flatMap((p) => [p.kg, p.avg]);
  const lo = Math.floor(Math.min(...vals) - 0.5), hi = Math.ceil(Math.max(...vals) + 0.5);
  const X = (i: number) => (n === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * i / (n - 1));
  const Y = (v: number) => y1 - (y1 - y0) * (v - lo) / (hi - lo || 1);
  const step = Math.max(1, Math.ceil((hi - lo) / 3));
  const grid: number[] = [];
  for (let v = lo; v <= hi; v += step) grid.push(v);
  const every = Math.ceil(n / 7);
  return (
    <svg viewBox="0 0 340 74" role="img" aria-label="Tendencia de peso" style={{ width: '100%', display: 'block' }}>
      {defs}
      {grid.map((v) => <g key={v}><line x1={x0} x2={x1} y1={Y(v)} y2={Y(v)} stroke="#1c1f22" /><T x={x0 - 5} y={Y(v) + 3} size={8.5} anchor="end" fill={C.tick}>{v}</T></g>)}
      {n > 1 && <polyline points={points.map((p, i) => `${X(i)},${Y(p.avg)}`).join(' ')} fill="none" stroke={C.green} strokeWidth={1.6} strokeDasharray="4 3" opacity={0.8} />}
      {n > 1 && <polyline points={points.map((p, i) => `${X(i)},${Y(p.kg)}`).join(' ')} fill="none" stroke={C.amber} strokeWidth={2} filter={url} />}
      {points.map((p, i) => <g key={p.date}>
        <circle cx={X(i)} cy={Y(p.kg)} r={2.6} fill="#0e0f11" stroke={C.amber} strokeWidth={1.5} />
        {(i % every === 0 || i === n - 1) && <T x={X(i)} y={70} size={5.5} lab fill={C.tick}>{p.date.slice(8, 10) + '/' + Number(p.date.slice(5, 7))}</T>}
      </g>)}
      {n > 1 && <T x={x1} y={y0 + 2} size={5.5} lab anchor="end" fill={C.green}>- - MEDIA MÓVIL</T>}
    </svg>
  );
}

/* ---------- íconos ---------- */
export const Icon = {
  flame: <svg viewBox="0 0 16 16"><path d="M8 1.5c1.8 2.4 4.5 4.4 4.5 7.6A4.5 4.5 0 0 1 3.5 9.1c0-1.4.6-2.6 1.6-3.6.2 1.3.9 2 1.7 2.3C6.5 5.6 7 3.4 8 1.5z" /></svg>,
  up: <svg viewBox="0 0 16 16"><path d="M8 2l6 7H10v5H6V9H2z" /></svg>,
  down: <svg viewBox="0 0 16 16"><path d="M8 14 2 7h4V2h4v5h4z" /></svg>,
  heart: <svg viewBox="0 0 16 16"><path d="M8 14.3 2.3 8.7a3.4 3.4 0 0 1 4.8-4.8L8 4.8l.9-.9a3.4 3.4 0 0 1 4.8 4.8z" /></svg>,
  dot: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" /></svg>,
  play: <svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>,
  back: <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>,
};
