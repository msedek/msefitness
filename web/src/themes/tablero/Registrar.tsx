import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import {
  GRASA, ageOn, efficiency, fmtDay, fmtDec, fmtInt, isHrAlert, kcalKeytel, stepsEq, weightOn, zoneOf, type GrasaId, type Session,
} from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { MiniTach } from './svg.tsx';
import { ConfirmButton, Dial, Who } from './ui.tsx';

interface Prefill { minutes?: number; kind?: 'grasa' | 'libre'; grasaLevel?: GrasaId }

export default function Registrar() {
  const { profile, sessions, weights, d, saveSession, deleteSession } = useReady();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const editId = Number(params.get('id')) || null;
  const editing = editId ? sessions.find((s) => s.id === editId) ?? null : null;
  const prefill = (location.state as { prefill?: Prefill } | null)?.prefill;

  // Valores iniciales: edición > prefill de la guiada > última sesión > guía del plan.
  const init = useMemo(() => {
    const last = d.last;
    const base = {
      date: d.today,
      minutes: last?.minutes ?? d.plan.minutes[0],
      km: last?.km ?? 10,
      hrAvg: last?.hrAvg ?? Math.round(d.fcmax * 0.7),
      hrMax: null as number | null, rpe: null as number | null, note: '',
      kind: 'libre' as Session['kind'], grasaLevel: null as GrasaId | null,
    };
    if (editing) return { ...base, ...editing, note: editing.note ?? '' };
    if (prefill?.kind === 'grasa') return { ...base, minutes: prefill.minutes ?? base.minutes, km: 0, kind: 'grasa' as const, grasaLevel: prefill.grasaLevel ?? profile.grasaLevel };
    return base;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [f, setF] = useState(init);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  if (editId && !editing) {
    return <><Who kicker="Editar" title="Sesión" /><div className="pod pad note">Esa sesión no existe o ya fue eliminada.</div></>;
  }

  const fcmax = d.fcmax;
  const steps = stepsEq(f.minutes, f.hrAvg, fcmax);
  const zone = zoneOf(f.hrAvg, fcmax);
  const pctF = f.hrAvg / fcmax;
  const eff = efficiency(f.km, f.hrAvg, f.minutes);
  const kg = weightOn(weights, f.date);
  const kcal = kg != null ? kcalKeytel(profile.sex, f.hrAvg, kg, ageOn(profile.birthDate, f.date), f.minutes) : null;
  const hot = isHrAlert(f.hrAvg, fcmax);
  const needKm = f.km <= 0;

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await saveSession({
        date: f.date, minutes: f.minutes, km: f.km, hrAvg: f.hrAvg, hrMax: f.hrMax, rpe: f.rpe,
        note: f.note.trim() || null, kind: f.kind, grasaLevel: f.kind === 'grasa' ? f.grasaLevel : null,
      }, editing?.id);
      nav(editing ? '/progreso' : '/', { replace: true });
    } catch (e) {
      setErr((e as Error).message); setBusy(false);
    }
  };

  return (
    <>
      <Who
        kicker={editing ? 'Editar sesión' : f.kind === 'grasa' && f.grasaLevel ? `Sesión guiada · ${GRASA[f.grasaLevel].title}` : 'Nueva sesión'}
        title={editing ? 'Ajustar' : 'Registrar'}
      />
      <div className="between" style={{ alignItems: 'center' }}>
        <span className="lab">Fecha</span>
        <label className="datepill">
          <span>{f.date === d.today ? `Hoy · ${fmtDay(f.date)}` : fmtDay(f.date)} ▾</span>
          <input type="date" value={f.date} max={d.today} aria-label="Fecha de la sesión" onChange={(e) => e.target.value && set('date', e.target.value)} />
        </label>
      </div>

      <Dial label="Tiempo" hint="obligatorio" value={f.minutes} onChange={(v) => set('minutes', v)} step={1} min={1} max={300} unit="min" />
      <Dial label="Distancia" hint={needKm ? <span className="warn">ingresa la de la bici</span> : 'la que marca la bici'} value={f.km} onChange={(v) => set('km', v)} step={0.1} min={0} max={200} dec={1} unit="km" />
      <Dial label="Pulso promedio" hint={`FCmáx ${fcmax} · ${d.age} años`} value={f.hrAvg} onChange={(v) => set('hrAvg', v)} step={1} min={40} max={230} unit="lpm" />

      <details className="more" open={!!(f.hrMax || f.rpe || f.note)}>
        <summary><b>Más datos · pulso máx, esfuerzo, nota</b><span className="lab">Opcional ▾</span></summary>
        <div className="inner">
          {f.hrMax == null
            ? <button type="button" className="ghost" onClick={() => set('hrMax', Math.max(f.hrAvg + 10, 60))}>+ Agregar pulso máximo</button>
            : <Dial small label="Pulso máximo" hint={<button type="button" className="link" onClick={() => set('hrMax', null)}>quitar</button>} value={f.hrMax} onChange={(v) => set('hrMax', v)} step={1} min={40} max={240} unit="lpm" />}
          <div className="field">
            <span className="lab">Esfuerzo percibido (1 suave · 10 máximo)</span>
            <div className="seg num" role="group" aria-label="Esfuerzo percibido">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button type="button" key={n} className={f.rpe === n ? 'on' : ''} aria-pressed={f.rpe === n} onClick={() => set('rpe', f.rpe === n ? null : n)}>{n}</button>
              ))}
            </div>
          </div>
          <label className="field">
            <span className="lab">Nota</span>
            <textarea className="text" maxLength={280} value={f.note} placeholder="Cómo te sentiste, resistencia de la bici…" onChange={(e) => set('note', e.target.value)} />
          </label>
        </div>
      </details>

      <div className="pod" style={{ padding: '12px 12px 12px', display: 'grid', gridTemplateColumns: '112px 1fr', gap: 12, alignItems: 'center' }}>
        <MiniTach steps={steps} target={d.plan.target} />
        <div>
          <div className="lab">Vista previa</div>
          <div className="readout" style={{ fontSize: 42, marginTop: 4 }}>{fmtInt(steps)}</div>
          <div className="note">pasos eq · {fmtInt(steps / d.plan.target * 100)} % de tu meta</div>
          <div className="zones" style={{ marginTop: 8 }} aria-label={`Zona ${zone}`}>
            {[1, 2, 3, 4, 5].map((z) => <span key={z} className={z === zone ? `on${hot ? ' hot' : ''}` : ''}>Z{z}</span>)}
          </div>
          <div className="note" style={{ marginTop: 6, fontSize: 12 }}>
            {fmtInt(pctF * 100)} % FCmáx · {fmtDec(eff, 2)} m por latido{kcal != null && <> · ≈ {fmtInt(kcal)} kcal</>}
          </div>
          {hot && <div className="note hot" style={{ fontSize: 12 }}>Sobre el 85 % de tu FCmáx: cuenta como alerta, no suma más pasos.</div>}
        </div>
      </div>

      {err && <div className="err" role="alert">{err}</div>}
      <button type="button" className="save" disabled={busy || needKm} onClick={save}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar sesión'}</button>
      {editing && (
        <ConfirmButton label="Eliminar sesión" confirm="Toca otra vez para eliminar"
          onConfirm={async () => { try { await deleteSession(editing.id); nav('/progreso', { replace: true }); } catch (e) { setErr((e as Error).message); } }} />
      )}
    </>
  );
}
