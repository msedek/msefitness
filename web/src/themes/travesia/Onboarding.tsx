import { useState } from 'react';
import {
  GRASA, GRASA_ORDER, PLANS, PLAN_ORDER, ageOn, bmi, fcmaxTanaka, fmtDec, fmtInt, todayCL,
  type GrasaId, type PlanId, type Sex, type ThemeId,
} from '../../../../shared/domain.ts';
import { useApp } from '../../data.tsx';
import { ContourMark } from './charts.tsx';
import { Seg, ThemePicker } from './Perfil.tsx';
import { NumField } from './ui.tsx';

const STEPS = 6;

export default function Onboarding() {
  const { suggestedName, email, createProfile } = useApp();
  const today = todayCL();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: suggestedName, birthDate: '', sex: null as Sex | null, heightCm: 170 as number | null, weightKg: 80 as number | null,
    plan: 'principiante' as PlanId, grasaLevel: 'iniciante' as GrasaId, theme: 'travesia' as ThemeId,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const age = /^\d{4}-\d{2}-\d{2}$/.test(f.birthDate) ? ageOn(f.birthDate, today) : null;
  const valid = [
    f.name.trim().length > 0,
    age != null && age >= 10 && age <= 100 && f.sex != null,
    f.heightCm != null && f.weightKg != null,
    true, true, true,
  ];

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await createProfile({
        name: f.name.trim(), birthDate: f.birthDate, sex: f.sex!, heightCm: f.heightCm!, fcmaxOverride: null,
        plan: f.plan, grasaLevel: f.grasaLevel, theme: f.theme, weightKg: f.weightKg!,
      });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : void finish());

  return (
    <div className="tv tv-onb">
      <div className="inner">
        <div className="steps" aria-label={`Paso ${step + 1} de ${STEPS}`}>
          {Array.from({ length: STEPS }, (_, i) => <i key={i} className={i <= step ? 'on' : undefined} />)}
        </div>

        {step === 0 && (
          <>
            <ContourMark size={110} />
            <h1>Antes de partir la travesía, ¿cómo te llamamos?</h1>
            <div>
              <label className="tv-label" htmlFor="tv-on-name">Nombre</label>
              <input id="tv-on-name" className="tv-input" value={f.name} maxLength={40} autoComplete="given-name" autoFocus
                onChange={(e) => set('name', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && valid[0] && next()} />
            </div>
            <p className="tv-note s">Entraste como {email}. Solo tú ves tus datos.</p>
          </>
        )}

        {step === 1 && (
          <>
            <h1>Tu edad marca la altura de tu pulso</h1>
            <div>
              <label className="tv-label" htmlFor="tv-on-birth">Fecha de nacimiento</label>
              <input id="tv-on-birth" className="tv-input" type="date" value={f.birthDate} max={today} onChange={(e) => set('birthDate', e.target.value)} />
            </div>
            {age != null && <p className="tv-note">{age} años → pulso máximo estimado <b>{fcmaxTanaka(age)} lpm</b> (208 − 0,7 × edad). Podrás ajustarlo en tu perfil.</p>}
            <div>
              <span className="tv-label">Sexo <span className="tv-muted" style={{ textTransform: 'none', letterSpacing: 0 }}>(solo para estimar calorías)</span></span>
              <Seg<Sex> label="Sexo" value={f.sex ?? ('' as Sex)} onChange={(v) => set('sex', v)} options={[['hombre', 'Hombre'], ['mujer', 'Mujer']]} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Estatura y peso de partida</h1>
            <div>
              <NumField label="Estatura" value={f.heightCm} onChange={(v) => set('heightCm', v)} step={1} min={100} max={230} unit="cm" />
              <NumField label="Peso" value={f.weightKg} onChange={(v) => set('weightKg', v)} step={0.1} min={30} max={300} decimals={1} unit="kg" hint="será tu primer pesaje" />
            </div>
            {f.heightCm && f.weightKg && <p className="tv-note s">IMC {fmtDec(bmi(f.weightKg, f.heightCm))}. La tendencia de peso vivirá en Quema de grasa.</p>}
          </>
        )}

        {step === 3 && (
          <>
            <h1>¿Desde qué altura partes?</h1>
            <p className="tv-note">Si recién empiezas, parte en <b>Principiante</b>: la app te sugerirá subir cuando tus datos lo muestren.</p>
            <div className="tv-plans">
              {PLAN_ORDER.map((id) => (
                <button key={id} type="button" className={`tv-plan${f.plan === id ? ' cur' : ''}`} aria-pressed={f.plan === id} onClick={() => set('plan', id)} style={{ textAlign: 'left', width: '100%', minHeight: 64 }}>
                  <div className="sw" style={{ background: id === 'principiante' ? 'var(--z1)' : id === 'medio' ? 'var(--z3)' : 'var(--z5)' }} />
                  <div><b>{PLANS[id].name}{id === 'principiante' ? ' · recomendado' : ''}</b><span>{PLANS[id].perWeek} ses/sem · {PLANS[id].minutes[0]}–{PLANS[id].minutes[1]} min · {PLANS[id].zoneLabel}</span></div>
                  <div className="m">{fmtInt(PLANS[id].target)}<small>pasos eq</small></div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1>Quema de grasa: sesiones guiadas</h1>
            <p className="tv-note">Sesiones de 30 a 45 min, bloque a bloque. Para empezar, <b>Iniciante</b>.</p>
            <div className="tv-routes">
              {GRASA_ORDER.map((id) => (
                <button key={id} type="button" className={`tv-rt${f.grasaLevel === id ? ' cur' : ''}`} aria-pressed={f.grasaLevel === id} onClick={() => set('grasaLevel', id)} style={{ textAlign: 'left', minHeight: 64 }}>
                  <div className="h"><b>{GRASA[id].name}<i>{GRASA[id].title}</i></b><span>{GRASA[id].blocks.reduce((a, b) => a + b.minutes, 0)} min · {GRASA[id].perWeek}/sem</span></div>
                  <p className="tv-note s" style={{ padding: '2px 0 4px' }}>{GRASA[id].note}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1>Elige cómo ver tu entrenamiento</h1>
            <ThemePicker value={f.theme} onPick={(t) => set('theme', t)} />
            <p className="tv-note s">Puedes cambiarlo cuando quieras desde tu perfil.</p>
          </>
        )}

        {error && <p className="tv-error" role="alert">{error}</p>}

        <div className="foot">
          {step > 0 ? <button type="button" className="tv-btn2" onClick={() => setStep(step - 1)}>Atrás</button> : <span />}
          <button type="button" className="tv-cta" disabled={!valid[step] || busy} onClick={next}>
            {step < STEPS - 1 ? 'Seguir' : 'Partir la travesía'} <small>{step + 1}/{STEPS}</small>
          </button>
        </div>
      </div>
    </div>
  );
}
