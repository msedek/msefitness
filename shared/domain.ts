// Reglas de dominio de msefitness. Lo usan la app (web) y el servidor (tests/validación).
// Fuente de las reglas: SPEC.md. Fechas siempre como 'YYYY-MM-DD' en hora local de Chile.

export type Sex = 'hombre' | 'mujer';
export type PlanId = 'principiante' | 'medio' | 'avanzado';
export type GrasaId = 'iniciante' | 'medio' | 'avanzado';
export type ThemeId = 'tablero' | 'travesia';
export type Zone = 1 | 2 | 3 | 4 | 5;

export interface Profile {
  email: string;
  name: string;
  birthDate: string;
  sex: Sex;
  heightCm: number;
  fcmaxOverride: number | null;
  plan: PlanId;
  planSince: string;
  grasaLevel: GrasaId;
  grasaSince: string;
  theme: ThemeId;
  planDismissedAt: string | null;
  grasaDismissedAt: string | null;
}

export interface Session {
  id: number;
  date: string;
  minutes: number;
  km: number;
  hrAvg: number;
  hrMax: number | null;
  rpe: number | null;
  note: string | null;
  kind: 'libre' | 'grasa';
  grasaLevel: GrasaId | null;
}

export interface Weight {
  id: number;
  date: string;
  kg: number;
}

// ---------- planes ----------

export interface Plan {
  id: PlanId;
  name: string;
  target: number;
  perWeek: number;
  minutes: [number, number];
  zoneLabel: string;
  zones: Zone[];
}

export const PLANS: Record<PlanId, Plan> = {
  principiante: { id: 'principiante', name: 'Principiante', target: 4000, perWeek: 3, minutes: [25, 35], zoneLabel: 'Z2 (60–70 %)', zones: [2] },
  medio: { id: 'medio', name: 'Medio', target: 7000, perWeek: 4, minutes: [40, 50], zoneLabel: 'Z3 (70–80 %)', zones: [3] },
  avanzado: { id: 'avanzado', name: 'Avanzado', target: 10000, perWeek: 5, minutes: [55, 65], zoneLabel: 'Z3 con tramos Z4', zones: [3, 4] },
};
export const PLAN_ORDER: PlanId[] = ['principiante', 'medio', 'avanzado'];

// ---------- quema de grasa ----------

export interface Block {
  minutes: number;
  zone: Zone;
  label: string;
  // Rango como fracción de FCmáx. "Z3 alto" usa la mitad superior de Z3.
  range: [number, number];
}

export interface GrasaProgram {
  id: GrasaId;
  name: string;
  title: string;
  perWeek: number;
  note: string;
  blocks: Block[];
}

const b = (minutes: number, zone: Zone, label: string, range: [number, number]): Block => ({ minutes, zone, label, range });
const CALM = (m: number) => b(m, 1, 'Vuelta a la calma', [0.5, 0.6]);
const WARM = (m: number) => b(m, 1, 'Calentamiento', [0.5, 0.6]);
const Z2 = (m: number, label = 'Z2 continuo') => b(m, 2, label, [0.6, 0.7]);
const Z3HI = (m: number) => b(m, 3, 'Z3 alto', [0.75, 0.8]);
const Z4 = (m: number) => b(m, 4, 'Intervalo Z4', [0.8, 0.9]);

export const GRASA: Record<GrasaId, GrasaProgram> = {
  iniciante: {
    id: 'iniciante', name: 'Iniciante', title: 'Base quemadora', perWeek: 3,
    note: 'Continuo en Z2, donde la grasa aporta la mayor proporción de energía.',
    blocks: [WARM(5), Z2(20), CALM(5)],
  },
  medio: {
    id: 'medio', name: 'Medio', title: 'Oleadas', perWeek: 4,
    note: 'Base en Z2 con tres oleadas en Z3 alto para subir el gasto.',
    blocks: [WARM(5), Z2(5), Z3HI(3), Z2(5), Z3HI(3), Z2(5), Z3HI(3), Z2(4), CALM(5)],
  },
  avanzado: {
    id: 'avanzado', name: 'Avanzado', title: 'Intervalos + fondo', perWeek: 4,
    note: 'Intervalos cortos en Z4 y fondo en Z2. Nunca dos días de intervalos seguidos.',
    blocks: [WARM(8), ...Array.from({ length: 6 }, () => [Z4(2), Z2(2, 'Z2 suave')]).flat(), Z2(8, 'Z2 constante'), CALM(5)],
  },
};
export const GRASA_ORDER: GrasaId[] = ['iniciante', 'medio', 'avanzado'];

export const programMinutes = (p: GrasaProgram) => p.blocks.reduce((s, x) => s + x.minutes, 0);

// ---------- fisiología ----------

export function ageOn(birthDate: string, on: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [y, m, d] = on.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

// Tanaka: 208 − 0,7 × edad.
export const fcmaxTanaka = (age: number) => Math.round(208 - 0.7 * age);

export function fcmaxOf(p: Pick<Profile, 'birthDate' | 'fcmaxOverride'>, on: string): number {
  return p.fcmaxOverride ?? fcmaxTanaka(ageOn(p.birthDate, on));
}

export function zoneOf(hr: number, fcmax: number): Zone {
  const pct = hr / fcmax;
  if (pct < 0.6) return 1;
  if (pct < 0.7) return 2;
  if (pct < 0.8) return 3;
  if (pct < 0.9) return 4;
  return 5;
}

export const ZONE_BOUNDS = [0.5, 0.6, 0.7, 0.8, 0.9, 1] as const;

export function zoneRanges(fcmax: number): Record<Zone, [number, number]> {
  const r = (a: number, z: number): [number, number] => [Math.round(fcmax * a), Math.round(fcmax * z)];
  return { 1: r(0.5, 0.6), 2: r(0.6, 0.7), 3: r(0.7, 0.8), 4: r(0.8, 0.9), 5: r(0.9, 1) };
}

export const bpmRange = (range: [number, number], fcmax: number): [number, number] =>
  [Math.round(fcmax * range[0]), Math.round(fcmax * range[1])];

// Pasos equivalentes = minutos × factor por zona. Z4–Z5 no dan más crédito que Z3.
export function stepsFactor(zone: Zone): number {
  return zone === 1 ? 100 : zone === 2 ? 130 : 160;
}

export function stepsEq(minutes: number, hrAvg: number, fcmax: number): number {
  return Math.round(minutes * stepsFactor(zoneOf(hrAvg, fcmax)));
}

export const ALERT_PCT = 0.85;
export const isHrAlert = (hrAvg: number, fcmax: number) => hrAvg / fcmax >= ALERT_PCT;
export const alertBpm = (fcmax: number) => Math.round(fcmax * ALERT_PCT);

// Metros por latido: distancia_m / (FC × min).
export function efficiency(km: number, hrAvg: number, minutes: number): number {
  if (!hrAvg || !minutes) return 0;
  return (km * 1000) / (hrAvg * minutes);
}

export const speedKmh = (km: number, minutes: number) => (minutes ? (km / minutes) * 60 : 0);

// Keytel et al. 2005 — estimación de gasto por pulso. kcal/min.
export function kcalKeytel(sex: Sex, hr: number, kg: number, age: number, minutes: number): number {
  const perMin = sex === 'hombre'
    ? (-55.0969 + 0.6309 * hr + 0.1988 * kg + 0.2017 * age) / 4.184
    : (-20.4022 + 0.4472 * hr - 0.1263 * kg + 0.074 * age) / 4.184;
  return Math.max(0, Math.round(perMin * minutes));
}

export const bmi = (kg: number, heightCm: number) => kg / (heightCm / 100) ** 2;

// ---------- fechas ----------

export function todayCL(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

const toUTC = (d: string) => { const [y, m, day] = d.split('-').map(Number); return Date.UTC(y, m - 1, day); };
const fromUTC = (t: number) => new Date(t).toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => fromUTC(toUTC(d) + n * 86400000);
export const daysBetween = (a: string, z: string) => Math.round((toUTC(z) - toUTC(a)) / 86400000);
// 0 = lunes … 6 = domingo
export const weekday = (d: string) => (new Date(toUTC(d)).getUTCDay() + 6) % 7;
export const weekStart = (d: string) => addDays(d, -weekday(d));

// ---------- sesiones enriquecidas ----------

export interface SessionStats extends Session {
  fcmax: number;
  zone: Zone;
  pctFcmax: number;
  steps: number;
  pctTarget: number;
  efficiency: number;
  speed: number;
  kcal: number | null;
  alert: boolean;
}

export function weightOn(weights: Weight[], date: string): number | null {
  let best: Weight | null = null;
  for (const w of weights) if (w.date <= date && (!best || w.date > best.date)) best = w;
  if (best) return best.kg;
  // Sin pesaje previo: el más antiguo disponible.
  const sorted = [...weights].sort((a, z) => a.date.localeCompare(z.date));
  return sorted[0]?.kg ?? null;
}

export function enrich(s: Session, profile: Profile, weights: Weight[], target = PLANS[profile.plan].target): SessionStats {
  const fcmax = fcmaxOf(profile, s.date);
  const zone = zoneOf(s.hrAvg, fcmax);
  const steps = stepsEq(s.minutes, s.hrAvg, fcmax);
  const kg = weightOn(weights, s.date);
  return {
    ...s,
    fcmax,
    zone,
    pctFcmax: s.hrAvg / fcmax,
    steps,
    pctTarget: steps / target,
    efficiency: efficiency(s.km, s.hrAvg, s.minutes),
    speed: speedKmh(s.km, s.minutes),
    kcal: kg == null ? null : kcalKeytel(profile.sex, s.hrAvg, kg, ageOn(profile.birthDate, s.date), s.minutes),
    alert: isHrAlert(s.hrAvg, fcmax),
  };
}

const byDate = (a: Session, z: Session) => a.date.localeCompare(z.date) || a.id - z.id;
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

// ---------- sugerencia de cambio de plan ----------

export interface Reason { ok: boolean; text: string }
export interface Suggestion {
  program: 'plan' | 'grasa';
  direction: 'subir' | 'bajar';
  from: string;
  to: string;
  reasons: Reason[];
}

export function suggestPlan(stats: SessionStats[], plan: PlanId): Suggestion | null {
  const s = [...stats].sort(byDate);
  const idx = PLAN_ORDER.indexOf(plan);
  const last5 = s.slice(-5);
  const last3 = s.slice(-3);

  if (idx > 0) {
    const low = last5.filter((x) => x.pctTarget < 0.6).length;
    const hot = last3.length === 3 && last3.every((x) => x.alert);
    if ((last5.length === 5 && low >= 3) || hot) {
      return {
        program: 'plan', direction: 'bajar', from: plan, to: PLAN_ORDER[idx - 1],
        reasons: [
          { ok: low >= 3, text: `${low} de tus últimas 5 sesiones bajo el 60 % de la meta` },
          { ok: hot, text: 'Pulso promedio sobre el 85 % de tu FCmáx en 3 sesiones seguidas' },
        ],
      };
    }
  }

  if (idx < PLAN_ORDER.length - 1 && s.length >= 10) {
    const last10 = s.slice(-10);
    const hits = last10.filter((x) => x.pctTarget >= 0.9).length;
    const prev = last10.slice(0, 5);
    const hrPrev = mean(prev.map((x) => x.hrAvg));
    const hrLast = mean(last5.map((x) => x.hrAvg));
    const effPrev = mean(prev.map((x) => x.efficiency));
    const effLast = mean(last5.map((x) => x.efficiency));
    const reasons: Reason[] = [
      { ok: hits >= 7, text: `${hits} de tus últimas 10 sesiones sobre el 90 % de la meta` },
      { ok: hrLast <= hrPrev + 2, text: `Pulso promedio ${Math.round(hrPrev)} → ${Math.round(hrLast)} lpm` },
      { ok: effLast >= effPrev, text: `Eficiencia ${fmtDec(effPrev, 2)} → ${fmtDec(effLast, 2)} m/latido` },
    ];
    if (reasons.every((r) => r.ok)) {
      return { program: 'plan', direction: 'subir', from: plan, to: PLAN_ORDER[idx + 1], reasons };
    }
  }
  return null;
}

// ---------- quema de grasa: sesión cumplida y cambio de nivel ----------
// Sin pulsómetro conectado la app no mide el tiempo en zona: una sesión guiada se da por
// cumplida si duró lo programado y el pulso promedio quedó entre 60 % y 85 % de la FCmáx.

export function grasaCompleted(s: SessionStats): boolean {
  if (s.kind !== 'grasa' || !s.grasaLevel) return false;
  const planned = programMinutes(GRASA[s.grasaLevel]);
  return s.minutes >= planned - 1 && s.pctFcmax >= 0.6 && s.pctFcmax < ALERT_PCT;
}

export const GRASA_UP_AFTER = 8;

export function grasaProgress(stats: SessionStats[], level: GrasaId, since: string) {
  const mine = stats.filter((x) => x.kind === 'grasa' && x.grasaLevel === level && x.date >= since).sort(byDate);
  return { sessions: mine, completed: mine.filter(grasaCompleted).length, needed: GRASA_UP_AFTER };
}

export function suggestGrasa(stats: SessionStats[], level: GrasaId, since: string): Suggestion | null {
  const { sessions, completed } = grasaProgress(stats, level, since);
  const idx = GRASA_ORDER.indexOf(level);
  const last3 = sessions.slice(-3);
  if (idx > 0 && last3.length === 3 && last3.every((x) => !grasaCompleted(x))) {
    return {
      program: 'grasa', direction: 'bajar', from: level, to: GRASA_ORDER[idx - 1],
      reasons: [{ ok: true, text: 'Tus últimas 3 sesiones guiadas no se completaron en zona' }],
    };
  }
  if (idx < GRASA_ORDER.length - 1 && completed >= GRASA_UP_AFTER) {
    return {
      program: 'grasa', direction: 'subir', from: level, to: GRASA_ORDER[idx + 1],
      reasons: [{ ok: true, text: `${completed} sesiones de ${GRASA[level].title} completadas en zona` }],
    };
  }
  return null;
}

// ---------- semana, racha, récords ----------

export function weekProgress(stats: SessionStats[], plan: PlanId, today: string) {
  const start = weekStart(today);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const ss = stats.filter((x) => x.date === date);
    return { date, sessions: ss, steps: ss.reduce((a, x) => a + x.steps, 0) };
  });
  const done = days.reduce((a, d) => a + d.sessions.length, 0);
  return { start, days, done, goal: PLANS[plan].perWeek, km: days.reduce((a, d) => a + d.sessions.reduce((k, x) => k + x.km, 0), 0) };
}

// Semanas seguidas (terminadas) cumpliendo sesiones/semana del plan. La semana en curso suma si ya se cumplió.
export function streakWeeks(stats: SessionStats[], plan: PlanId, today: string): number {
  const goal = PLANS[plan].perWeek;
  const count = (ws: string) => stats.filter((x) => x.date >= ws && x.date < addDays(ws, 7)).length;
  let ws = weekStart(today);
  let streak = count(ws) >= goal ? 1 : 0;
  ws = addDays(ws, -7);
  while (count(ws) >= goal) { streak++; ws = addDays(ws, -7); }
  return streak;
}

export function records(stats: SessionStats[]) {
  const pick = (f: (x: SessionStats) => number) =>
    stats.reduce<SessionStats | null>((best, x) => (!best || f(x) > f(best) ? x : best), null);
  return { longest: pick((x) => x.minutes), farthest: pick((x) => x.km), mostSteps: pick((x) => x.steps), bestEfficiency: pick((x) => x.efficiency) };
}

export function zoneMinutes(stats: SessionStats[]): Record<Zone, number> {
  const out: Record<Zone, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const x of stats) out[x.zone] += x.minutes;
  return out;
}

// Media móvil simple de n pesajes.
export function weightTrend(weights: Weight[], n = 3) {
  const w = [...weights].sort((a, z) => a.date.localeCompare(z.date));
  return w.map((x, i) => {
    const win = w.slice(Math.max(0, i - n + 1), i + 1);
    return { ...x, avg: mean(win.map((y) => y.kg)) };
  });
}

// ---------- todo lo derivado, en un solo lugar ----------

export function derive(profile: Profile, sessions: Session[], weights: Weight[], today: string) {
  const target = PLANS[profile.plan].target;
  const stats = [...sessions].sort(byDate).map((s) => enrich(s, profile, weights, target));
  const fcmax = fcmaxOf(profile, today);
  const last = stats.at(-1) ?? null;
  const planSug = suggestPlan(stats.filter((x) => x.date >= profile.planSince), profile.plan);
  const grasaSug = suggestGrasa(stats, profile.grasaLevel, profile.grasaSince);
  // Descartar oculta la sugerencia hasta que haya una sesión nueva posterior al descarte.
  const hidden = (sug: Suggestion | null, dismissedAt: string | null) =>
    sug && dismissedAt && last && last.date <= dismissedAt.slice(0, 10) ? null : sug;
  const sortedW = [...weights].sort((a, z) => a.date.localeCompare(z.date));
  const currentKg = sortedW.at(-1)?.kg ?? null;
  return {
    today,
    fcmax,
    age: ageOn(profile.birthDate, today),
    zones: zoneRanges(fcmax),
    alertBpm: alertBpm(fcmax),
    plan: PLANS[profile.plan],
    grasa: GRASA[profile.grasaLevel],
    stats,
    last,
    week: weekProgress(stats, profile.plan, today),
    streak: streakWeeks(stats, profile.plan, today),
    totalKm: stats.reduce((a, x) => a + x.km, 0),
    records: records(stats),
    zoneMinutes: zoneMinutes(stats),
    planSuggestion: hidden(planSug, profile.planDismissedAt),
    grasaSuggestion: hidden(grasaSug, profile.grasaDismissedAt),
    grasaProgress: grasaProgress(stats, profile.grasaLevel, profile.grasaSince),
    weights: weightTrend(sortedW),
    currentKg,
    startKg: sortedW[0]?.kg ?? null,
    bmi: currentKg ? bmi(currentKg, profile.heightCm) : null,
  };
}
export type Derived = ReturnType<typeof derive>;

// ---------- formato chileno ----------

export const fmtInt = (n: number) => Math.round(n).toLocaleString('es-CL');
export const fmtDec = (n: number, d = 1) => n.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtPct = (f: number) => `${Math.round(f * 100)} %`;
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
export const fmtDate = (d: string) => { const [, m, day] = d.split('-').map(Number); return `${day} ${MES[m - 1]}`; };
export const fmtDay = (d: string) => `${DIA[weekday(d)]} ${fmtDate(d)}`;
export const dayShort = (d: string) => DIA[weekday(d)];
export const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
