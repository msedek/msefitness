import { useState } from 'react';
import {
  GRASA, GRASA_ORDER, PLANS, PLAN_ORDER, ageOn, fcmaxTanaka, type GrasaId, type PlanId, type Sex, type ThemeId,
} from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { NumField, Sec, TitleBlock } from './ui.tsx';

export function ThemePicker({ value, onPick }: { value: ThemeId; onPick: (t: ThemeId) => void }) {
  const info: Record<ThemeId, [string, string]> = { tablero: ['Tablero', 'cuadro de instrumentos'], travesia: ['Travesía', 'carta topográfica'] };
  return (
    <div className="tv-themes" role="group" aria-label="Tema de la app">
      {(['tablero', 'travesia'] as ThemeId[]).map((t) => (
        <button key={t} type="button" aria-pressed={value === t} onClick={() => onPick(t)}>
          <div className={`sw ${t}`} aria-hidden="true" />
          <b>{info[t][0]}</b>
          <span>{info[t][1]}</span>
        </button>
      ))}
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string, string?][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="tv-seg" role="group" aria-label={label}>
      {options.map(([v, t, s]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{t}{s && <small>{s}</small>}</button>
      ))}
    </div>
  );
}

export default function Perfil() {
  const { profile, d, email, updateProfile, setTheme } = useReady();
  const [f, setF] = useState({
    name: profile.name, birthDate: profile.birthDate, sex: profile.sex, heightCm: profile.heightCm,
    fcmaxOverride: profile.fcmaxOverride, plan: profile.plan, grasaLevel: profile.grasaLevel,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setMsg(null); };

  const age = /^\d{4}-\d{2}-\d{2}$/.test(f.birthDate) ? ageOn(f.birthDate, d.today) : null;
  const calc = age != null ? fcmaxTanaka(age) : null;
  const changedPlan = f.plan !== profile.plan || f.grasaLevel !== profile.grasaLevel;

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ ...f, name: f.name.trim() });
      setMsg({ ok: true, text: 'Ficha actualizada.' });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally { setBusy(false); }
  };

  return (
    <>
      <TitleBlock k="Ficha del caminante" title={profile.name} r={`${d.age} años`} rb={`FCmáx ${d.fcmax}`} />

      <section className="tv-form" aria-labelledby="tv-pf-datos">
        <Sec id="tv-pf-datos" title="Datos" aside={email} />
        <div>
          <label className="tv-label" htmlFor="tv-pf-name">Nombre</label>
          <input id="tv-pf-name" className="tv-input" value={f.name} maxLength={40} autoComplete="given-name" onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="tv-label" htmlFor="tv-pf-birth">Fecha de nacimiento</label>
          <input id="tv-pf-birth" className="tv-input" type="date" value={f.birthDate} max={d.today} onChange={(e) => set('birthDate', e.target.value)} />
        </div>
        <div>
          <span className="tv-label">Sexo <span className="tv-muted" style={{ textTransform: 'none', letterSpacing: 0 }}>(solo para estimar calorías)</span></span>
          <Seg<Sex> label="Sexo" value={f.sex} onChange={(v) => set('sex', v)} options={[['hombre', 'Hombre'], ['mujer', 'Mujer']]} />
        </div>
        <NumField label="Estatura" value={f.heightCm} onChange={(v) => v != null && set('heightCm', v)} step={1} min={100} max={230} unit="cm" small />
        <NumField label="FCmáx manual" value={f.fcmaxOverride} onChange={(v) => set('fcmaxOverride', v)} step={1} min={120} max={230} unit="lpm" small nullable
          start={calc ?? 170} placeholder="auto"
          hint={f.fcmaxOverride == null ? `Calculada por edad: ${calc ?? '—'} lpm (208 − 0,7 × edad). Úsala si no tienes un test.` : `La calculada sería ${calc ?? '—'}. Baja a “auto” con − desde 120.`} />
      </section>

      <section className="tv-form" aria-labelledby="tv-pf-plan">
        <Sec id="tv-pf-plan" title="Plan y nivel" aside="cambio manual" />
        <div>
          <span className="tv-label">Plan de pasos</span>
          <Seg<PlanId> label="Plan" value={f.plan} onChange={(v) => set('plan', v)}
            options={PLAN_ORDER.map((p) => [p, PLANS[p].name, `${PLANS[p].target / 1000}k`] as [PlanId, string, string])} />
        </div>
        <div>
          <span className="tv-label">Quema de grasa</span>
          <Seg<GrasaId> label="Nivel de quema de grasa" value={f.grasaLevel} onChange={(v) => set('grasaLevel', v)}
            options={GRASA_ORDER.map((g) => [g, GRASA[g].name, `${GRASA[g].blocks.reduce((a, b) => a + b.minutes, 0)} min`] as [GrasaId, string, string])} />
        </div>
        {changedPlan && <p className="tv-note s">Al cambiar de plan o nivel, el análisis para sugerencias vuelve a contar desde hoy.</p>}
      </section>

      {msg && <p className={msg.ok ? 'tv-note' : 'tv-error'} role="status">{msg.text}</p>}
      <button type="button" className="tv-cta" onClick={save} disabled={busy || !f.name.trim() || !age}>Guardar ficha</button>

      <section className="tv-form" aria-labelledby="tv-pf-tema">
        <Sec id="tv-pf-tema" title="Tema" aside="se aplica al tocar" />
        <ThemePicker value="travesia" onPick={(t) => { if (t !== 'travesia') void setTheme(t); }} />
      </section>
    </>
  );
}
