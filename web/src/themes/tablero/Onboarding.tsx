import { useState, type ReactNode } from 'react';
import {
  GRASA, GRASA_ORDER, PLANS, PLAN_ORDER, ageOn, bmi, fcmaxTanaka, fmtDec, fmtInt, programMinutes, todayCL,
  type GrasaId, type PlanId, type Sex, type ThemeId,
} from '../../../../shared/domain.ts';
import { useApp } from '../../data.tsx';
import { SWATCH, THEME_NAMES, THEME_NOTE } from './info.ts';
import { Dial, Full } from './ui.tsx';

const STEPS = 6;

export default function Onboarding() {
  const app = useApp();
  const today = todayCL();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: app.suggestedName, birthDate: '', sex: null as Sex | null, heightCm: 170, weightKg: 80,
    plan: 'principiante' as PlanId, grasaLevel: 'iniciante' as GrasaId, theme: app.theme as ThemeId,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const age = f.birthDate ? ageOn(f.birthDate, today) : null;

  const valid = [
    f.name.trim().length > 0,
    !!f.birthDate && age != null && age >= 10 && age <= 100 && !!f.sex,
    true, true, true, true,
  ][step];

  const create = async () => {
    setBusy(true); setErr(null);
    try {
      await app.createProfile({
        name: f.name.trim(), birthDate: f.birthDate, sex: f.sex!, heightCm: f.heightCm, fcmaxOverride: null,
        plan: f.plan, grasaLevel: f.grasaLevel, theme: f.theme, weightKg: f.weightKg,
      });
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  const screens: [string, string, ReactNode][] = [
    ['Encendido', `Hola${f.name.trim() ? `, ${f.name.trim()}` : ''}`, <>
      <p className="note">Vamos a calibrar tus instrumentos: con tu edad calculo tu pulso máximo y tus zonas; con tu peso, las calorías estimadas. Toma un minuto.</p>
      <label className="field"><span className="lab">¿Cómo te llamamos?</span>
        <input className="text" value={f.name} maxLength={40} autoComplete="given-name" onChange={(e) => setF({ ...f, name: e.target.value })} />
      </label>
      <p className="fine">Entraste como {app.email}.</p>
    </>],
    ['Calibración · 1', 'Tú', <>
      <label className="field"><span className="lab">Fecha de nacimiento</span>
        <input className="text" type="date" value={f.birthDate} max={today} onChange={(e) => setF({ ...f, birthDate: e.target.value })} />
      </label>
      {age != null && age >= 10 && <p className="note">{age} años → pulso máximo estimado <b style={{ color: 'var(--ink)' }}>{fcmaxTanaka(age)} lpm</b> (208 − 0,7 × edad). Podrás ajustarlo en tu perfil.</p>}
      <div className="field"><span className="lab">Sexo · solo para la fórmula de calorías</span>
        <div className="seg" role="group" aria-label="Sexo">
          {(['hombre', 'mujer'] as Sex[]).map((s) => <button type="button" key={s} className={f.sex === s ? 'on' : ''} aria-pressed={f.sex === s} onClick={() => setF({ ...f, sex: s })}>{s}</button>)}
        </div>
      </div>
    </>],
    ['Calibración · 2', 'Medidas', <>
      <Dial label="Estatura" value={f.heightCm} onChange={(v) => setF({ ...f, heightCm: v })} step={1} min={100} max={230} unit="cm" />
      <Dial label="Peso actual" value={f.weightKg} onChange={(v) => setF({ ...f, weightKg: v })} step={0.1} min={30} max={300} dec={1} unit="kg" />
      <p className="note">IMC {fmtDec(bmi(f.weightKg, f.heightCm), 1)}. Este es tu primer pesaje; después registras uno por semana en Quema de grasa.</p>
    </>],
    ['Caja de cambios', 'Plan de pasos', <>
      <p className="note">Cada sesión se convierte en pasos equivalentes según su duración y tu pulso. Si hoy no pedaleas con regularidad, parte en Principiante: la app te avisa cuando estés listo para subir.</p>
      {PLAN_ORDER.map((id, i) => (
        <button type="button" key={id} className={`gear${f.plan === id ? ' cur' : ''}`} aria-pressed={f.plan === id} onClick={() => setF({ ...f, plan: id })}>
          <div className="n">{i + 1}</div>
          <div><h4>{PLANS[id].name}{id === 'principiante' && <span className="tag">RECOMENDADO</span>}</h4><p>{PLANS[id].perWeek} ses/sem · {PLANS[id].minutes[0]}–{PLANS[id].minutes[1]} min · {PLANS[id].zoneLabel}</p></div>
          <div className="m">{fmtInt(PLANS[id].target)}<small>pasos eq</small></div>
        </button>
      ))}
    </>],
    ['Programa guiado', 'Quema de grasa', <>
      <p className="note">Sesiones guiadas de 30 a 45 minutos por bloques de pulso. También suman pasos a tu plan.</p>
      {GRASA_ORDER.map((id, i) => (
        <button type="button" key={id} className={`gear${f.grasaLevel === id ? ' cur' : ''}`} aria-pressed={f.grasaLevel === id} onClick={() => setF({ ...f, grasaLevel: id })}>
          <div className="n">{i + 1}</div>
          <div><h4>{GRASA[id].title}</h4><p>{GRASA[id].name} · {programMinutes(GRASA[id])} min · {GRASA[id].perWeek}/sem</p></div>
          <span />
        </button>
      ))}
    </>],
    ['Último ajuste', 'Tema', <>
      <p className="note">Elige cómo quieres ver tus datos. Puedes cambiarlo cuando quieras desde tu perfil.</p>
      {(['tablero', 'travesia'] as ThemeId[]).map((t) => (
        <button type="button" key={t} className={`choice${f.theme === t ? ' on' : ''}`} aria-pressed={f.theme === t} onClick={() => setF({ ...f, theme: t })}>
          <div><h4>{THEME_NAMES[t]}</h4><p>{THEME_NOTE[t]}</p></div>
          <div className="theme-sw">{SWATCH[t].map((c) => <i key={c} style={{ background: c }} />)}</div>
        </button>
      ))}
    </>],
  ];
  const [kicker, title, body] = screens[step];

  return (
    <Full>
      <div className="steps" aria-label={`Paso ${step + 1} de ${STEPS}`}>{Array.from({ length: STEPS }, (_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
      <header className="who"><h1><small>{kicker}</small>{title}</h1></header>
      <div className="pod pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{body}</div>
      {err && <div className="err" role="alert">{err}</div>}
      <div className="acts">
        <button type="button" className="ghost" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Atrás</button>
        {step < STEPS - 1
          ? <button type="button" className="go" disabled={!valid} onClick={() => setStep(step + 1)}>Siguiente</button>
          : <button type="button" className="go" disabled={busy} onClick={create}>{busy ? 'Encendiendo…' : 'Arrancar'}</button>}
      </div>
    </Full>
  );
}
