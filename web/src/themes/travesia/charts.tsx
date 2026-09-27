import { useId, type ReactNode, type SVGProps } from 'react';
import {
  bpmRange, dayShort, fmtDec, fmtInt, type Block, type PlanId, type SessionStats, type Suggestion, type Zone,
} from '../../../../shared/domain.ts';
import { ALTURA, C, COND, SERIF, ZC, tint } from './palette.ts';
import { posicion, ventana } from './ruta.ts';

// ---------- utilidades ----------

type TP = Omit<SVGProps<SVGTextElement>, 'x' | 'y'> & { x: number; y: number; children: ReactNode; size?: number; w?: number; serif?: boolean; italic?: boolean; color?: string; anchor?: 'start' | 'middle' | 'end' };
function T({ x, y, children, size = 12, w = 400, serif, italic, color = C.ink, anchor = 'start', ...rest }: TP) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={w} fontFamily={serif ? SERIF : COND} fontStyle={italic ? 'italic' : undefined}
      fill={color} textAnchor={anchor} {...rest}>{children}</text>
  );
}

// Curva de nivel orgánica.
export function blob(cx: number, cy: number, r: number, seed: number, amp = 1, n = 90) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rr = r * (1 + amp * (0.07 * Math.sin(2 * t + seed) + 0.05 * Math.sin(3 * t + seed * 1.7) + 0.03 * Math.sin(5 * t + seed * 2.3)));
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(t)).toFixed(1)} ${(cy + rr * 0.78 * Math.sin(t)).toFixed(1)}`;
  }
  return `${d}Z`;
}

const line = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

function trend(vals: number[]) {
  const n = vals.length;
  const mx = (n - 1) / 2;
  const my = vals.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  vals.forEach((v, i) => { num += (i - mx) * (v - my); den += (i - mx) ** 2; });
  const m = den ? num / den : 0;
  return { a: my - m * mx, m };
}

const shortDate = (d: string) => { const [, m, day] = d.split('-').map(Number); return `${day}/${m}`; };
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const dm = (d: string) => { const [, m, day] = d.split('-').map(Number); return `${day} ${MES[m - 1]}`; };

// ---------- 1 · cumbre: medidor de curvas de nivel ----------

export function Summit({ steps, target, date }: { steps: number | null; target: number; date?: string }) {
  const levels = Math.max(3, Math.round(target / 1000));
  const cx = 150;
  const cy = 128;
  const rMax = 118;
  const rStep = (rMax - 24) / (levels - 1);
  const dx = 24 / (levels - 1);
  const dy = 20.4 / (levels - 1);
  const tIdx = (k: number) => (levels <= 7 ? Math.round((k * 6) / (levels - 1)) : k);
  const reached = steps ?? 0;
  const px = cx + 24;
  const py = cy - 20.4;
  const pct = steps == null ? null : steps / target;
  return (
    <svg viewBox="0 0 350 250" width="100%" role="img"
      aria-label={steps == null ? 'Sin sesiones todavía' : `Última sesión ${fmtInt(steps)} pasos equivalentes, ${Math.round((pct ?? 0) * 100)} % de la meta`}>
      {Array.from({ length: levels }, (_, k) => (
        <path key={k} d={blob(cx + k * dx, cy - k * dy, rMax - k * rStep, 1.3 + k * 0.18, 1.1)}
          fill={(k + 1) * 1000 <= reached ? tint(tIdx(k)) : C.paper} stroke={C.contour} strokeWidth={k === levels - 1 ? 2 : 1}
          strokeDasharray={steps == null ? '4 3' : undefined} />
      ))}
      {Array.from({ length: levels - 1 }, (_, k) => (
        <path key={k} d={blob(cx + k * dx + dx / 2, cy - k * dy - dy / 2, rMax - k * rStep - rStep / 2, 1.39 + k * 0.18, 1.1)}
          fill="none" stroke={C.contour2} strokeWidth={0.6} />
      ))}
      {steps != null && [1, 3].filter((k) => k <= levels).map((k) => {
        const r = rMax - (k - 1) * rStep;
        const x = cx + (k - 1) * dx - r * 0.97;
        const y = cy - (k - 1) * dy + 4;
        return (
          <g key={k}>
            <rect x={x - 15} y={y - 10} width={30} height={13} fill={(k * 1000 <= reached) ? tint(tIdx(k - 1)) : C.paper} />
            <T x={x} y={y} size={11} w={600} anchor="middle" color={C.contour}>{fmtInt(k * 1000)}</T>
          </g>
        );
      })}
      <path d={`M${px - 9} ${py + 1} L${px} ${py - 14} L${px + 9} ${py + 1}Z`} fill={C.ink} />
      {steps == null ? (
        <T x={px} y={py + 30} size={17} anchor="middle" serif italic color={C.ink2}>sin ascenso aún</T>
      ) : (
        <>
          <T x={px} y={py + 34} size={40} w={800} anchor="middle">{fmtInt(steps)}</T>
          <T x={px} y={py + 50} size={13} anchor="middle" color={C.ink2} letterSpacing={2}>pasos eq</T>
        </>
      )}
      <g transform="translate(282,20)">
        <T x={0} y={0} size={11} w={700} color={C.ink2} letterSpacing={2.5}>CUMBRE</T>
        <T x={0} y={26} size={28} w={800} color={pct != null && pct >= 0.9 ? C.forest : C.contour}>{pct == null ? '—' : `${Math.round(pct * 100)} %`}</T>
        <T x={0} y={42} size={13} serif italic color={C.ink2}>de {fmtInt(target)}</T>
        {date && <T x={0} y={58} size={12} serif italic color={C.ink3}>{dm(date)}</T>}
      </g>
      <g transform="translate(318,214)">
        <path d="M0 -16 L4 0 L0 16 L-4 0Z" fill="none" stroke={C.ink} strokeWidth={1} />
        <path d="M0 -16 L4 0 L-4 0Z" fill={C.ink} />
        <T x={0} y={-20} size={11} w={700} anchor="middle">N</T>
      </g>
    </svg>
  );
}

// ---------- 1 · semana como sendero ----------

export function WeekTrail({ days, today, target }: { days: { date: string; steps: number; sessions: unknown[] }[]; today: string; target: number }) {
  const xs = days.map((_, i) => 22 + i * 51);
  const trail = `M${xs[0]} 34 ${xs.slice(1).map((x, i) => `Q ${x - 25} ${i % 2 ? 22 : 46} ${x} 34`).join(' ')}`;
  return (
    <svg viewBox="0 0 350 80" width="100%" role="img" aria-label={`Semana: ${days.filter((d) => d.sessions.length).length} días con sesión`}>
      <path d={trail} fill="none" stroke={C.route} strokeWidth={2} strokeDasharray="6 4" />
      {days.map((d, i) => {
        const x = xs[i];
        const [, , day] = d.date.split('-').map(Number);
        const label = `${dayShort(d.date)} ${day}`;
        if (d.sessions.length) {
          return (
            <g key={d.date}>
              <line x1={x} y1={34} x2={x} y2={6} stroke={C.ink} strokeWidth={1.4} />
              <path d={`M${x} 6 L${x + 15} 11 L${x} 16Z`} fill={d.steps >= target ? C.forest : ZC[3]} stroke={C.ink} strokeWidth={0.8} />
              <circle cx={x} cy={34} r={5} fill={C.ink} />
              <T x={x} y={62} size={12} w={600} anchor="middle">{fmtInt(d.steps)}</T>
              <T x={x} y={77} size={11} anchor="middle" color={d.date === today ? C.route : C.ink2} w={d.date === today ? 700 : 400}>{label}</T>
            </g>
          );
        }
        return (
          <g key={d.date}>
            <circle cx={x} cy={34} r={4} fill={C.paper} stroke={d.date === today ? C.route : C.ink3} strokeWidth={1.2} />
            <T x={x} y={62} size={12} serif italic anchor="middle" color={d.date === today ? C.route : C.ink3}>
              {d.date === today ? 'hoy' : d.date < today ? '—' : ''}
            </T>
            <T x={x} y={77} size={11} anchor="middle" color={d.date === today ? C.route : C.ink2} w={d.date === today ? 700 : 400}>{label}</T>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- 1 · mini franja de la Ruta 5 ----------

export function MiniStrip({ totalKm }: { totalKm: number }) {
  const p = posicion(totalKm);
  const hs = ventana(p, 2, 2);
  const k0 = hs[0][1];
  const k1 = hs[hs.length - 1][1];
  const x0 = 12;
  const x1 = 338;
  const X = (km: number) => x0 + ((km - k0) / (k1 - k0)) * (x1 - x0);
  const here = X(Math.min(Math.max(p.km, k0), k1));
  return (
    <svg viewBox="0 0 350 64" width="100%" role="img" aria-label={`Vas en el kilómetro ${fmtDec(p.km)} de la Ruta 5`}>
      <line x1={x0} y1={30} x2={x1} y2={30} stroke={C.ink3} strokeWidth={2} strokeDasharray="5 4" />
      <line x1={x0} y1={30} x2={here} y2={30} stroke={C.route} strokeWidth={4} />
      {hs.map(([n, km], i) => {
        const x = X(km);
        const past = km <= p.km;
        const top = i % 2 === 0;
        return (
          <g key={n}>
            <circle cx={x} cy={30} r={past ? 4.5 : 4} fill={past ? C.route : C.paper} stroke={C.ink} strokeWidth={1.2} />
            <T x={x} y={top ? 16 : 54} size={12.5} serif italic anchor={i === 0 ? 'start' : i === hs.length - 1 ? 'end' : 'middle'}
              w={n === p.prev[0] ? 600 : 400}>{n}</T>
          </g>
        );
      })}
      <circle cx={here} cy={30} r={8} fill="none" stroke={C.route} strokeWidth={2} />
    </svg>
  );
}

// ---------- 2 · barra hipsométrica de zonas ----------

export function ZoneBar({ hr, fcmax }: { hr: number; fcmax: number }) {
  const x0 = 4;
  const w = 322;
  const lo = 50;
  const hi = 100;
  const X = (p: number) => x0 + ((Math.min(hi, Math.max(lo, p)) - lo) / (hi - lo)) * w;
  const pct = (hr / fcmax) * 100;
  const Z: [number, number, Zone][] = [[50, 60, 1], [60, 70, 2], [70, 80, 3], [80, 90, 4], [90, 100, 5]];
  const mx = X(pct);
  let relief = `M${x0} 18`;
  for (let i = 0; i <= 40; i++) relief += ` L${(x0 + (i / 40) * w).toFixed(1)} ${(18 - (i / 40) * 14 - Math.sin(i * 1.3) * 1.5).toFixed(1)}`;
  return (
    <svg viewBox="0 0 330 76" width="100%" role="img" aria-label={`${hr} lpm, ${Math.round(pct)} % de tu FCmáx`}>
      {Z.map(([a, b, z]) => (
        <g key={z}>
          <rect x={X(a)} y={18} width={X(b) - X(a)} height={22} fill={ZC[z]} stroke={C.ink} strokeWidth={0.8} />
          <T x={(X(a) + X(b)) / 2} y={33} size={12} w={700} anchor="middle" color={z === 5 ? '#fff' : C.ink}>Z{z}</T>
          <T x={X(a)} y={54} size={10.5} anchor={a === 50 ? 'start' : 'middle'} color={C.ink2}>{a} %</T>
        </g>
      ))}
      <T x={X(100)} y={54} size={10.5} anchor="end" color={C.ink2}>100 %</T>
      <path d={`${relief} L${x0 + w} 18Z`} fill={C.paper3} stroke={C.contour} strokeWidth={0.8} />
      <line x1={mx} y1={2} x2={mx} y2={44} stroke={C.route} strokeWidth={2.5} />
      <circle cx={mx} cy={4} r={4} fill={C.route} />
      <T x={Math.min(Math.max(mx, 50), 280)} y={71} size={12.5} w={700} anchor="middle" color={C.route}>{hr} lpm · {Math.round(pct)} %</T>
    </svg>
  );
}

// ---------- 3 · perfil de elevación de pasos eq ----------

export function ElevationProfile({ stats, target }: { stats: SessionStats[]; target: number }) {
  const id = useId().replace(/:/g, '');
  const L = 38;
  const R = 344;
  const T0 = 24;
  const B = 140;
  const vals = stats.map((s) => s.steps);
  const lo = Math.max(0, Math.floor(Math.min(...vals, target * 0.6) / 1000) * 1000 - 1000);
  const hi = Math.max(target, ...vals) * 1.07;
  const Y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T0);
  const n = vals.length;
  const X = (i: number) => (n === 1 ? (L + R) / 2 : L + (i * (R - L)) / (n - 1));
  const stepK = (hi - lo) / 1000 > 8 ? 2000 : 1000;
  const grid: number[] = [];
  for (let v = Math.ceil(lo / stepK) * stepK + (lo % stepK === 0 ? stepK : 0); v < hi; v += stepK) if (Math.abs(v - target) >= stepK / 2) grid.push(v);
  const pts: [number, number][] = vals.map((v, i) => [X(i), Y(v)]);
  const area = n === 1
    ? `M${X(0) - 18} ${B} L${X(0)} ${Y(vals[0])} L${X(0) + 18} ${B}Z`
    : `M${L} ${B} ${pts.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} L${R} ${B}Z`;
  const bands: [number, number][] = [];
  for (let v = lo; v < hi; v += 1000) bands.push([v, Math.min(v + 1000, hi)]);
  const ticks = n <= 1 ? [0] : Array.from(new Set([0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1]));
  const lastIdx = n - 1;
  return (
    <svg viewBox="0 0 350 176" width="100%" role="img" aria-label={`Pasos equivalentes por sesión, meta ${fmtInt(target)}`}>
      <defs><clipPath id={`tvcp${id}`}><path d={area} /></clipPath></defs>
      {grid.map((v) => (
        <g key={v}>
          <line x1={L} y1={Y(v)} x2={R} y2={Y(v)} stroke={C.contour2} strokeWidth={0.7} strokeDasharray="2 3" />
          <T x={L - 4} y={Y(v) + 4} size={10.5} anchor="end" color={C.ink2}>{fmtInt(v)}</T>
        </g>
      ))}
      <g clipPath={`url(#tvcp${id})`}>
        {bands.map(([a, b], i) => <rect key={a} x={L - 20} y={Y(b)} width={R - L + 40} height={Y(a) - Y(b)} fill={a >= target ? '#cf9a62' : tint(Math.min(4, i))} />)}
        {bands.map(([a]) => <line key={a} x1={L - 20} y1={Y(a + 500)} x2={R + 20} y2={Y(a + 500)} stroke={C.contour} strokeWidth={0.4} opacity={0.6} />)}
      </g>
      <line x1={L} y1={Y(target)} x2={R} y2={Y(target)} stroke={C.route} strokeWidth={1.4} strokeDasharray="6 4" />
      <T x={L - 4} y={Y(target) + 4} size={10.5} w={700} anchor="end" color={C.route}>{fmtInt(target)}</T>
      <T x={L + 4} y={Y(target) - 5} size={12} serif italic color={C.route}>meta</T>
      {n > 1 && <path d={line(pts)} fill="none" stroke={C.ink} strokeWidth={1.6} />}
      {stats.map((s, i) => s.pctTarget >= 0.9 && (
        <path key={s.id} d={`M${X(i) - 4} ${Y(s.steps) - 3} L${X(i)} ${Y(s.steps) - 10} L${X(i) + 4} ${Y(s.steps) - 3}Z`} fill={s.pctTarget >= 1 ? C.route : C.ink} />
      ))}
      {n === 1 && <circle cx={X(0)} cy={Y(vals[0])} r={3.5} fill={C.ink} />}
      <T x={X(lastIdx) - (n > 1 ? 4 : -6)} y={Y(vals[lastIdx]) - 14} size={12} w={700} anchor={n > 1 ? 'end' : 'start'} color={C.route}>{fmtInt(vals[lastIdx])}</T>
      {n > 2 && <T x={X(0) + 2} y={Y(vals[0]) - 6} size={12} w={600}>{fmtInt(vals[0])}</T>}
      <line x1={L} y1={B} x2={R} y2={B} stroke={C.ink} strokeWidth={1} />
      {ticks.map((i) => (
        <T key={i} x={X(i)} y={B + 16} size={11} color={C.ink2} anchor={n <= 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{dm(stats[i].date)}</T>
      ))}
      <T x={L} y={B + 32} size={11} serif italic color={C.ink2}>▲ sesión sobre el 90 % de la meta</T>
    </svg>
  );
}

// ---------- 3 · línea genérica (pulso, eficiencia) ----------

export function Spark({ values, dates, H = 92, bands = [], alert, fmt = (v) => String(v), unit = '' }: {
  values: number[]; dates: string[]; H?: number; bands?: [number, number, string, string][]; alert?: number; fmt?: (v: number) => string; unit?: string;
}) {
  const L = 4;
  const R = 346;
  const T0 = 8;
  const B = H - 18;
  const n = values.length;
  const pad = (Math.max(...values) - Math.min(...values)) * 0.25 || Math.max(1, Math.abs(values[0]) * 0.05);
  let lo = Math.min(...values) - pad;
  let hi = Math.max(...values) + pad;
  if (alert && alert <= hi + pad * 2) hi = Math.max(hi, alert + pad * 0.5);
  if (lo === hi) { lo -= 1; hi += 1; }
  const Y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T0);
  const X = (i: number) => (n === 1 ? (L + R) / 2 : L + (i * (R - L)) / (n - 1));
  const tr = n >= 3 ? trend(values) : null;
  return (
    <svg viewBox={`0 0 350 ${H}`} width="100%" role="img" aria-label={`Último valor ${fmt(values[n - 1])} ${unit}`}>
      {bands.map(([a, b, c, name]) => {
        const ya = Y(Math.max(a, lo));
        const yb = Y(Math.min(b, hi));
        if (ya <= yb) return null;
        return (
          <g key={name}>
            <rect x={L} y={yb} width={R - L} height={ya - yb} fill={c} opacity={0.55} />
            <T x={R - 2} y={yb + 12} size={11} w={700} anchor="end" color={C.ink2}>{name}</T>
          </g>
        );
      })}
      {alert && alert < hi && (
        <g>
          <line x1={L} y1={Y(alert)} x2={R} y2={Y(alert)} stroke={C.route} strokeWidth={1} strokeDasharray="2 3" />
          <T x={L + 2} y={Y(alert) - 4} size={10.5} w={700} color={C.route}>alerta {alert}</T>
        </g>
      )}
      {tr && <line x1={X(0)} y1={Y(tr.a)} x2={X(n - 1)} y2={Y(tr.a + tr.m * (n - 1))} stroke={C.route} strokeWidth={1.3} strokeDasharray="5 4" />}
      {n > 1 && <path d={line(values.map((v, i) => [X(i), Y(v)]))} fill="none" stroke={C.ink} strokeWidth={1.6} />}
      {values.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={2} fill={C.paper} stroke={C.ink} strokeWidth={1} />)}
      <circle cx={X(n - 1)} cy={Y(values[n - 1])} r={4.5} fill={C.route} />
      <T x={L} y={H - 3} size={11} color={C.ink2}>{fmt(values[0])} {unit} · {dm(dates[0])}</T>
      {n > 1 && <T x={R} y={H - 3} size={11} color={C.ink2} anchor="end">{fmt(values[n - 1])} {unit} · {dm(dates[n - 1])}</T>}
    </svg>
  );
}

// ---------- 3 · mapa de la travesía ----------

export function RouteMap({ totalKm }: { totalKm: number }) {
  const p = posicion(totalKm);
  const hs = ventana(p, 3, 3);
  const k0 = hs[0][1];
  const k1 = hs[hs.length - 1][1];
  const y0 = 24;
  const y1 = 372;
  const k = (y1 - y0) / (k1 - k0);
  const Y = (km: number) => y0 + (km - k0) * k;
  const coast = (km: number) => 60 + Math.sin(km / 37) * 9 + Math.sin(km / 13) * 3 + ((km - k0) * 0.05 * 400) / (k1 - k0);
  const stepKm = (k1 - k0) / 90;
  const kms: number[] = [];
  for (let km = k0 - (k1 - k0) * 0.08; km <= k1 + (k1 - k0) * 0.1; km += stepKm) kms.push(km);
  const coastPts = kms.map((km) => [coast(km), Y(km)] as [number, number]);
  const sea = `M0 -10 L${coast(kms[0]).toFixed(1)} -10 ${coastPts.map((q) => `L${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ')} L0 410Z`;
  const rx = (km: number) => 170 + Math.sin(km / 55) * 16;
  const routeKms = kms.filter((km) => km >= k0 && km <= k1);
  const routePts = [k0, ...routeKms, k1].map((km) => [rx(km), Y(km)] as [number, number]);
  const here = Math.min(Math.max(p.km, k0), k1);
  const donePts = [k0, ...routeKms.filter((km) => km <= here), here].map((km) => [rx(km), Y(km)] as [number, number]);
  const hx = rx(here);
  const hy = Y(here);
  const scaleKm = (k1 - k0) > 600 ? 200 : 100;
  const hachures = [];
  for (let km = k0; km <= k1; km += (k1 - k0) / 44) hachures.push(km);
  const tag = `${fmtDec(totalKm)} km · tú`;
  return (
    <svg viewBox="0 0 350 404" width="100%" role="img" aria-label={`Mapa de la Ruta 5: vas en el km ${fmtDec(p.km)}, entre ${p.prev[0]} y ${p.next?.[0] ?? 'el final'}`}>
      <path d={sea} fill={C.water2} />
      {[1, 2, 3, 4].map((j) => (
        <path key={j} d={line(coastPts.map((q) => [q[0] - j * 9, q[1]]))} fill="none" stroke={C.water} strokeWidth={0.6} opacity={0.6 - j * 0.1} />
      ))}
      <path d={line(coastPts)} fill="none" stroke={C.water} strokeWidth={1.2} />
      <T x={18} y={210} size={13} serif italic color={C.water} anchor="middle" transform="rotate(-90 18 210)" letterSpacing={2}>Océano Pacífico</T>
      {hachures.map((km) => {
        const x = 300 + Math.sin(km / 29) * 10;
        const y = Y(km);
        return (
          <g key={km}>
            <path d={`M${x - 11} ${y + 5} L${x} ${y - 6} L${x + 11} ${y + 5}`} fill="none" stroke={C.contour} strokeWidth={1} />
            <path d={`M${x + 14} ${y + 9} L${x + 23} ${y} L${x + 32} ${y + 9}`} fill="none" stroke={C.contour2} strokeWidth={0.9} />
          </g>
        );
      })}
      <T x={262} y={210} size={12} serif italic color={C.contour} anchor="middle" transform="rotate(-90 262 210)" letterSpacing={1.5}>Cordillera de los Andes</T>
      <path d={line(routePts)} fill="none" stroke={C.ink3} strokeWidth={2} strokeDasharray="5 4" />
      <path d={line(donePts)} fill="none" stroke={C.route} strokeWidth={4.5} strokeLinejoin="round" />
      {hs.map(([n, km]) => {
        const x = rx(km);
        const y = Y(km);
        const past = km <= p.km;
        return (
          <g key={n}>
            <rect x={x - 5} y={y - 5} width={10} height={10} fill={past ? C.ink : C.paper} stroke={C.ink} strokeWidth={1.3} />
            <T x={x - 14} y={y + 5} size={15} serif italic anchor="end" w={past ? 600 : 400} color={past ? C.ink : C.ink2}>{n}</T>
            {Math.abs(y - hy) > 16 && <T x={x + 14} y={y + 4} size={11.5} color={C.ink2}>{km ? `km ${fmtInt(km)}` : 'inicio'}</T>}
          </g>
        );
      })}
      <circle cx={hx} cy={hy} r={11} fill="none" stroke={C.route} strokeWidth={1.5} />
      <circle cx={hx} cy={hy} r={4.5} fill={C.route} />
      <rect x={hx + 16} y={hy - 12} width={tag.length * 6.6 + 12} height={22} fill={C.route} />
      <T x={hx + 22} y={hy + 3} size={13} w={700} color="#fff" letterSpacing={0.5}>{tag}</T>
      <g transform="translate(190,396)">
        <rect x={0} y={-5} width={(scaleKm / 2) * k} height={4} fill={C.ink} stroke={C.ink} strokeWidth={0.7} />
        <rect x={(scaleKm / 2) * k} y={-5} width={(scaleKm / 2) * k} height={4} fill={C.paper} stroke={C.ink} strokeWidth={0.7} />
        <T x={0} y={-8} size={9.5} color={C.ink2}>0</T>
        <T x={scaleKm * k} y={-8} size={9.5} color={C.ink2} anchor="middle">{scaleKm} km</T>
      </g>
      <g transform="translate(330,16)">
        <path d="M0 -10 L3 2 L0 0 L-3 2Z" fill={C.ink} />
        <T x={0} y={14} size={10} w={700} anchor="middle">N</T>
      </g>
    </svg>
  );
}

// ---------- 3 · calendario de constancia ----------

export function Calendar({ stats, weekStarts, goal }: { stats: SessionStats[]; weekStarts: string[]; goal: number }) {
  const L = 44;
  const T0 = 22;
  const cw = 38;
  const ch = 29;
  const byDate = new Map<string, SessionStats[]>();
  for (const s of stats) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
  const addDays = (d: string, n: number) => { const [y, m, day] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10); };
  const H = T0 + weekStarts.length * ch + 24;
  return (
    <svg viewBox={`0 0 350 ${H}`} width="100%" role="img" aria-label={`Constancia de ${weekStarts.length} semanas`}>
      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <T key={i} x={L + i * cw + cw / 2} y={12} size={11} w={700} anchor="middle" color={C.ink2} letterSpacing={1}>{d}</T>)}
      {weekStarts.map((ws, w) => {
        let count = 0;
        const cells = Array.from({ length: 7 }, (_, i) => {
          const date = addDays(ws, i);
          const ss = byDate.get(date) ?? [];
          count += ss.length;
          const best = ss.reduce((a, s) => Math.max(a, s.pctTarget), 0);
          const x = L + i * cw;
          const y = T0 + w * ch;
          return (
            <g key={date}>
              <rect x={x + 1} y={y + 1} width={cw - 2} height={ch - 2} fill={ss.length ? (best >= 0.9 ? '#e6c586' : best >= 0.75 ? '#dfe2a6' : '#d9e6c9') : C.paper2} stroke={C.paper} strokeWidth={1} />
              {ss.length > 0 && <path d={`M${x + cw / 2 - 6} ${y + ch - 8} L${x + cw / 2} ${y + 7} L${x + cw / 2 + 6} ${y + ch - 8}Z`} fill={best >= 1 ? C.route : C.ink} />}
            </g>
          );
        });
        const fx = L + 7 * cw + 12;
        const fy = T0 + w * ch + 4;
        return (
          <g key={ws}>
            <T x={L - 8} y={T0 + w * ch + 19} size={10.5} anchor="end" color={C.ink3}>{shortDate(ws)}</T>
            {cells}
            {count >= goal ? (
              <g>
                <line x1={fx} y1={fy} x2={fx} y2={fy + 21} stroke={C.ink} strokeWidth={1.2} />
                <path d={`M${fx} ${fy} L${fx + 13} ${fy + 4} L${fx} ${fy + 9}Z`} fill={C.forest} />
              </g>
            ) : (
              <T x={fx - 2} y={fy + 15} size={11} color={C.ink3}>{count}/{goal}</T>
            )}
          </g>
        );
      })}
      {(() => {
        const y = T0 + weekStarts.length * ch + 14;
        return (
          <g>
            <T x={L} y={y} size={11} color={C.ink2}>▲ sesión</T>
            {([['#d9e6c9', '<75 %'], ['#dfe2a6', '75–89 %'], ['#e6c586', '≥90 %']] as const).map(([c, t], i) => (
              <g key={t}>
                <rect x={L + 58 + i * 70} y={y - 9} width={11} height={11} fill={c} stroke={C.ink3} strokeWidth={0.6} />
                <T x={L + 73 + i * 70} y={y} size={11} color={C.ink2}>{t}</T>
              </g>
            ))}
          </g>
        );
      })()}
    </svg>
  );
}

// ---------- 3 · tiempo por zona ----------

export function ZoneTime({ minutes }: { minutes: Record<Zone, number> }) {
  const zs = ([1, 2, 3, 4, 5] as Zone[]).filter((z) => minutes[z] > 0);
  const tot = zs.reduce((a, z) => a + minutes[z], 0);
  const W = 346;
  let x = 2;
  return (
    <svg viewBox="0 0 350 34" width="100%" role="img" aria-label={zs.map((z) => `Z${z} ${Math.round(minutes[z])} min`).join(', ')}>
      {zs.map((z) => {
        const w = (W * minutes[z]) / tot;
        const g = (
          <g key={z}>
            <rect x={x} y={4} width={w} height={24} fill={ZC[z]} stroke={C.ink} strokeWidth={0.8} />
            {w > 90 && <T x={x + 6} y={21} size={13} w={700} color={z === 5 ? '#fff' : C.ink}>Z{z} · {fmtInt(minutes[z])} min · {Math.round((minutes[z] / tot) * 100)} %</T>}
            {w > 26 && w <= 90 && <T x={x + w / 2} y={21} size={12} w={700} anchor="middle" color={z === 5 ? '#fff' : C.ink}>Z{z}</T>}
          </g>
        );
        x += w;
        return g;
      })}
    </svg>
  );
}

// ---------- quema: perfil de bloques ----------

const blockH = (b: Block) => (b.zone === 3 && b.range[0] >= 0.75 ? 3.5 : b.zone);

export function BlockProfile({ blocks, maxMin, H = 58, cursorSec, dark = false, label }: {
  blocks: Block[]; maxMin: number; H?: number; cursorSec?: number; dark?: boolean; label?: string;
}) {
  const W = 318;
  const x0 = 4;
  const base = H - 4;
  const u = (H - 14) / 4;
  const X = (m: number) => x0 + (m / maxMin) * W;
  let t = 0;
  let d = `M${X(0)} ${base}`;
  const now = cursorSec != null ? cursorSec / 60 : null;
  const rects = blocks.map((b, i) => {
    const x = X(t);
    const x2 = X(t + b.minutes);
    const y = base - blockH(b) * u;
    d += ` L${x} ${y} L${x2} ${y}`;
    const done = now != null && t + b.minutes <= now;
    t += b.minutes;
    return <rect key={i} x={x} y={y} width={x2 - x} height={base - y} fill={ZC[b.zone]} opacity={done ? 0.35 : 1} stroke={dark ? 'none' : C.paper} strokeWidth={0.6} />;
  });
  const total = t;
  const cx = now != null ? X(Math.min(now, total)) : 0;
  let cy = base;
  if (now != null) {
    let acc = 0;
    for (const b of blocks) { if (now < acc + b.minutes || acc + b.minutes >= total) { cy = base - blockH(b) * u; break; } acc += b.minutes; }
  }
  const vbH = now != null ? H + 16 : H;
  return (
    <svg viewBox={`0 0 330 ${vbH}`} width="100%" role="img" aria-label={label ?? `Perfil de la sesión, ${total} minutos`}>
      {rects}
      <path d={`${d} L${X(total)} ${base}`} fill="none" stroke={dark ? C.paper : C.ink} strokeWidth={1.3} strokeLinejoin="round" />
      <line x1={X(0)} y1={base} x2={X(total)} y2={base} stroke={dark ? C.paper : C.ink} strokeWidth={1} />
      {now != null && (
        <g>
          <line x1={cx} y1={cy - 8} x2={cx} y2={base} stroke={C.route} strokeWidth={2.2} />
          <circle cx={cx} cy={cy - 8} r={5} fill={C.route} stroke={C.paper} strokeWidth={1.5} />
          <T x={X(0)} y={H + 12} size={11} color={C.paper3}>0′</T>
          <T x={X(total)} y={H + 12} size={11} color={C.paper3} anchor="end">{total}′</T>
        </g>
      )}
    </svg>
  );
}

export function ProfileLegend() {
  const items: [string, Zone][] = [['Z1 calma', 1], ['Z2 fondo', 2], ['Z3 alto', 3], ['Z4 intervalo', 4]];
  return (
    <svg viewBox="0 0 350 22" width="100%" aria-hidden="true">
      {items.map(([t, z], i) => (
        <g key={t}>
          <rect x={2 + i * 86} y={5} width={12} height={12} fill={ZC[z]} stroke={C.ink3} strokeWidth={0.6} />
          <T x={18 + i * 86} y={15} size={11.5} color={C.ink2}>{t}</T>
        </g>
      ))}
    </svg>
  );
}

// ---------- guiada: medidor de pulso del bloque ----------

export function HrGauge({ fcmax, range, hr }: { fcmax: number; range: [number, number]; hr: number | null }) {
  const lo = Math.round(fcmax * 0.5);
  const hi = Math.round(fcmax * 0.95);
  const x0 = 4;
  const w = 322;
  const X = (v: number) => x0 + ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * w;
  const zb: [number, number, Zone][] = [[0.5, 0.6, 1], [0.6, 0.7, 2], [0.7, 0.8, 3], [0.8, 0.9, 4], [0.9, 0.95, 5]];
  return (
    <svg viewBox="0 0 330 60" width="100%" role="img" aria-label={`Rango objetivo ${range[0]} a ${range[1]} lpm${hr ? `, marcas ${hr}` : ''}`}>
      {zb.map(([a, b, z]) => {
        const [xa, xb] = bpmRange([a, b], fcmax);
        return (
          <g key={z}>
            <rect x={X(xa)} y={18} width={X(xb) - X(xa)} height={14} fill={ZC[z]} opacity={0.9} />
            {z < 5 && <T x={(X(xa) + X(xb)) / 2} y={29} size={10.5} w={700} anchor="middle">Z{z}</T>}
          </g>
        );
      })}
      <rect x={X(range[0])} y={13} width={X(range[1]) - X(range[0])} height={24} fill="none" stroke={C.paper} strokeWidth={2} />
      {bpmRange([0.6, 0.7], fcmax).concat(bpmRange([0.8, 0.9], fcmax)).map((v, i) => (
        <T key={i} x={X(v)} y={50} size={10.5} anchor="middle" color={C.paper3}>{v}</T>
      ))}
      {hr != null && (
        <g>
          <path d={`M${X(hr)} 13 l-6 -9 h12z`} fill={C.route} stroke={C.paper} strokeWidth={1} />
        </g>
      )}
    </svg>
  );
}

// ---------- quema: avance del nivel ----------

export function LevelDots({ completed, needed }: { completed: number; needed: number }) {
  const step = 314 / (needed - 1);
  return (
    <svg viewBox="0 0 350 42" width="100%" role="img" aria-label={`${completed} de ${needed} sesiones completadas`}>
      <line x1={18} y1={20} x2={332} y2={20} stroke={C.ink3} strokeWidth={1.5} strokeDasharray="4 4" />
      {completed > 0 && <line x1={18} y1={20} x2={18 + Math.min(completed - 1, needed - 1) * step} y2={20} stroke={C.route} strokeWidth={3} />}
      {Array.from({ length: needed }, (_, i) => {
        const x = 18 + i * step;
        const ok = i < completed;
        return (
          <g key={i}>
            <path d={`M${x - 9} 28 L${x} 11 L${x + 9} 28Z`} fill={ok ? C.forest : C.paper} stroke={ok ? C.ink : C.ink3} strokeWidth={1.2} />
            <T x={x} y={40} size={10.5} anchor="middle" color={C.ink2}>{i + 1}</T>
          </g>
        );
      })}
      <path d={`M${332} 11 l0 -10 l10 3 l-10 3`} fill={C.route} stroke={C.ink} strokeWidth={0.8} />
    </svg>
  );
}

// ---------- quema: peso como ladera ----------

export function WeightChart({ points }: { points: { date: string; kg: number; avg: number }[] }) {
  const n = points.length;
  const L = 36;
  const R = 340;
  const T0 = 16;
  const B = 118;
  const kgs = points.flatMap((p) => [p.kg, p.avg]);
  const lo = Math.floor(Math.min(...kgs) * 2 - 1) / 2;
  const hi = Math.ceil(Math.max(...kgs) * 2 + 1) / 2;
  const Y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T0);
  const X = (i: number) => (n === 1 ? (L + R) / 2 : L + (i * (R - L)) / (n - 1));
  const pts: [number, number][] = points.map((p, i) => [X(i), Y(p.kg)]);
  const gridStep = hi - lo > 6 ? 2 : 1;
  const grid: number[] = [];
  for (let v = Math.ceil(lo); v <= hi; v += gridStep) grid.push(v);
  const labelIdx = n <= 4 ? points.map((_, i) => i) : Array.from(new Set([0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1]));
  return (
    <svg viewBox="0 0 350 152" width="100%" role="img" aria-label={`Peso de ${fmtDec(points[0].kg)} a ${fmtDec(points[n - 1].kg)} kg`}>
      {grid.map((v) => (
        <g key={v}>
          <line x1={L} y1={Y(v)} x2={R} y2={Y(v)} stroke={C.contour2} strokeWidth={0.7} strokeDasharray="2 3" />
          <T x={L - 5} y={Y(v) + 4} size={10.5} anchor="end" color={C.ink2}>{v}</T>
        </g>
      ))}
      {n > 1 && (
        <>
          <path d={`M${L} ${B} ${pts.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} L${R} ${B}Z`} fill={C.forest2} opacity={0.55} />
          {[1, 2, 3, 4, 5].map((k) => (
            <path key={k} d={line(pts.map((p) => [p[0], Math.min(B, p[1] + k * 12)]))} fill="none" stroke={C.forest} strokeWidth={0.5} opacity={0.5} />
          ))}
          <path d={line(points.map((p, i) => [X(i), Y(p.avg)]))} fill="none" stroke={C.route} strokeWidth={1.6} strokeDasharray="6 4" />
          <path d={line(pts)} fill="none" stroke={C.ink} strokeWidth={1.8} />
        </>
      )}
      {points.map((p, i) => (
        <circle key={p.date} cx={X(i)} cy={Y(p.kg)} r={i === n - 1 ? 4.5 : 2.8} fill={i === n - 1 ? C.route : C.paper} stroke={C.ink} strokeWidth={1.1} />
      ))}
      {labelIdx.map((i) => (
        <T key={i} x={X(i)} y={B + 15} size={11} color={C.ink2} anchor={n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{dm(points[i].date)}</T>
      ))}
      <line x1={L} y1={B} x2={R} y2={B} stroke={C.ink} strokeWidth={1} />
      {n > 1 && <T x={X(0) + 6} y={Y(points[0].kg) - 7} size={12} w={700}>{fmtDec(points[0].kg)}</T>}
      <T x={X(n - 1) + (n > 1 ? -8 : 8)} y={Y(points[n - 1].kg) - 9} size={12} w={700} anchor={n > 1 ? 'end' : 'start'} color={C.route}>{fmtDec(points[n - 1].kg)}</T>
      {n > 1 && <T x={L} y={B + 30} size={11} serif italic color={C.ink2}>— peso   - - media móvil (3 pesajes)</T>}
    </svg>
  );
}

// ---------- plan: corte del terreno ----------

const PLAN_SPOT: Record<PlanId, [number, number]> = { principiante: [56, 133], medio: [180, 99], avanzado: [292, 25] };

export function TerrainSection({ plan, suggestion }: { plan: PlanId; suggestion: Suggestion | null }) {
  const id = useId().replace(/:/g, '');
  const ground = 'M0 186 L0 136 C 30 134, 70 138, 104 132 C 120 128, 126 104, 140 100 C 170 94, 200 102, 222 96 C 238 90, 246 48, 262 40 C 280 30, 300 26, 316 18 L 332 14 L350 26 L350 186Z';
  const [px, py] = PLAN_SPOT[plan];
  const to = suggestion ? PLAN_SPOT[suggestion.to as PlanId] : null;
  const up = suggestion?.direction === 'subir';
  const lab = (x: number, y: number, a: string, b: string, c: string, col?: string) => (
    <g>
      <T x={x} y={y} size={13} w={800} letterSpacing={1.5} color={col ?? C.ink}>{a}</T>
      <T x={x} y={y + 14} size={12.5} serif italic color={col ?? C.ink2}>{b}</T>
      <T x={x} y={y + 30} size={15} w={800} color={col ?? C.ink}>{c}</T>
    </g>
  );
  const flagLeft = plan !== 'principiante';
  return (
    <svg viewBox="0 -34 350 224" width="100%" role="img" aria-label={`Estás en ${ALTURA[plan].name}${suggestion ? `; sugerencia: ${suggestion.direction} a ${ALTURA[suggestion.to as PlanId].name}` : ''}`}>
      <defs><clipPath id={`tvts${id}`}><path d={ground} /></clipPath></defs>
      <path d={ground} fill={C.paper2} />
      <g clipPath={`url(#tvts${id})`}>
        <rect x={0} y={-34} width={112} height={224} fill={ZC[1]} />
        <rect x={112} y={0} width={122} height={190} fill={ZC[3]} />
        <rect x={234} y={0} width={116} height={190} fill={ZC[5]} opacity={0.85} />
        {Array.from({ length: 10 }, (_, i) => 110 + i * 8).map((y) => <line key={y} x1={0} y1={y} x2={350} y2={y + 4} stroke={C.ink} strokeWidth={0.4} opacity={0.35} />)}
      </g>
      <path d="M316 18 L332 14 L350 26 L341 30 L330 24 L322 28Z" fill="#fbfaf5" stroke={C.ink} strokeWidth={0.6} />
      <path d={ground.replace(/ L350 186Z$/, '').replace(/^M0 186 L/, 'M')} fill="none" stroke={C.ink} strokeWidth={1.6} />
      {lab(10, 150, 'PRINCIPIANTE', 'Valle', '4.000')}
      {lab(122, 126, 'MEDIO', 'Precordillera', '7.000')}
      {lab(244, 76, 'AVANZADO', 'Cordillera', '10.000 tope', '#fff')}
      <line x1={px} y1={py} x2={px} y2={py - 40} stroke={C.ink} strokeWidth={1.4} />
      <path d={`M${px} ${py - 40} L${px + 18} ${py - 35} L${px} ${py - 29}Z`} fill={C.route} />
      <T x={flagLeft ? px - 6 : px + 22} y={py - 44} size={13} serif italic w={600} color={C.route} anchor={flagLeft ? 'end' : 'start'}>estás aquí</T>
      {to && (
        <g>
          <path d={up ? `M${px + 26} ${py - 24} Q ${(px + to[0]) / 2 + 10} ${Math.min(py, to[1]) - 30}, ${to[0] - 6} ${to[1] - 12}`
            : `M${px - 8} ${py - 24} Q ${(px + to[0]) / 2} ${Math.min(py, to[1]) - 40}, ${to[0] + 6} ${to[1] - 14}`}
            fill="none" stroke={up ? C.forest : C.route} strokeWidth={2} strokeDasharray="5 4" />
          <circle cx={to[0]} cy={to[1] - 12} r={4} fill={up ? C.forest : C.route} />
          <T x={up ? Math.min((px + to[0]) / 2 - 12, 220) : (px + to[0]) / 2} y={Math.max(14, Math.min(py, to[1]) - 22)} size={13} serif italic w={600} color={up ? C.forest : C.route} anchor="middle">
            {up ? 'paso abierto' : 'descenso sugerido'}
          </T>
        </g>
      )}
    </svg>
  );
}

// ---------- evidencias mini ----------

export function Triangles({ flags }: { flags: boolean[] }) {
  return (
    <svg viewBox="0 0 110 22" width={110} aria-hidden="true">
      {flags.map((ok, i) => {
        const x = 6 + i * 10.8;
        return <path key={i} d={`M${x - 4.5} 17 L${x} 5 L${x + 4.5} 17Z`} fill={ok ? C.forest : C.paper} stroke={ok ? C.ink : C.ink3} strokeWidth={1} />;
      })}
    </svg>
  );
}

export function MiniSpark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const X = (i: number) => 4 + (i * 102) / (values.length - 1);
  const Y = (v: number) => 26 - ((v - lo) / (hi - lo || 1)) * 22;
  return (
    <svg viewBox="0 0 110 30" width={110} aria-hidden="true">
      <path d={line(values.map((v, i) => [X(i), Y(v)]))} fill="none" stroke={C.ink} strokeWidth={1.3} />
      <circle cx={X(values.length - 1)} cy={Y(values[values.length - 1])} r={3.2} fill={C.forest} />
    </svg>
  );
}

// ---------- carga: curvas que se dibujan ----------

export function ContourMark({ size = 120 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 160" width={size} className="tv-draw" aria-hidden="true">
      {Array.from({ length: 6 }, (_, k) => (
        <path key={k} d={blob(100 + k * 3, 84 - k * 3, 88 - k * 14, 1.3 + k * 0.2, 1.1, 70)} fill="none" stroke={k === 5 ? C.route : C.contour} strokeWidth={k === 5 ? 2 : 1.2} />
      ))}
    </svg>
  );
}

