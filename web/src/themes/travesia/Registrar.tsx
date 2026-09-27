import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import {
  GRASA, efficiency, fmtDay, fmtDec, fmtInt, isHrAlert, speedKmh, stepsEq, zoneOf, type GrasaId,
} from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { ZoneBar } from './charts.tsx';
import { ConfirmButton, NumField, TitleBlock } from './ui.tsx';

interface Prefill { minutes?: number; kind?: 'libre' | 'grasa'; grasaLevel?: GrasaId }

export default function Registrar() {
  const { d, sessions, saveSession, deleteSession } = useReady();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const editId = Number(params.get('id')) || undefined;
  const editing = editId ? sessions.find((s) => s.id === editId) : undefined;
  const prefill = (location.state as { prefill?: Prefill } | null)?.prefill;
  const base = d.last;

  // Valores iniciales: la sesión que se edita, o la última registrada, o una guía del plan.
  const [form, setForm] = useState(() => {
    if (editing) return { ...editing };
    const zone = d.zones[d.plan.zones[0]];
    const minutes = prefill?.minutes ?? base?.minutes ?? d.plan.minutes[0];
    return {
      date: d.today,
      minutes,
      km: base ? Number(((base.km / base.minutes) * minutes).toFixed(1)) : Number(((minutes / 60) * 20).toFixed(1)),
      hrAvg: base?.hrAvg ?? Math.round((zone[0] + zone[1]) / 2),
      hrMax: null as number | null,
      rpe: null as number | null,
      note: null as string | null,
      kind: prefill?.kind ?? ('libre' as const),
      grasaLevel: prefill?.grasaLevel ?? null,
    };
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  if (editId && !editing) {
    return (
      <>
        <TitleBlock k="Etapa" title="No encontrada" />
        <p className="tv-note">Esa sesión no existe o ya fue eliminada.</p>
        <button type="button" className="tv-btn2" onClick={() => navigate('/progreso')}>Volver al progreso</button>
      </>
    );
  }

  const fcmax = d.fcmax;
  const steps = stepsEq(form.minutes, form.hrAvg, fcmax);
  const zone = zoneOf(form.hrAvg, fcmax);
  const pct = steps / d.plan.target;
  const alert = isHrAlert(form.hrAvg, fcmax);
  const ideal = d.plan.zones.includes(zone);
  const terrain = alert ? 'sobre el 85 %: terreno peligroso, baja el ritmo'
    : ideal ? 'terreno ideal para tu plan'
    : zone < d.plan.zones[0] ? `bajo tu zona objetivo (${d.plan.zoneLabel})` : `sobre tu zona objetivo (${d.plan.zoneLabel})`;
  const hasOptional = form.hrMax != null || form.rpe != null || !!form.note;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveSession({
        date: form.date, minutes: form.minutes, km: form.km, hrAvg: form.hrAvg, hrMax: form.hrMax, rpe: form.rpe,
        note: form.note?.trim() || null, kind: form.kind, grasaLevel: form.kind === 'grasa' ? form.grasaLevel : null,
      }, editId);
      navigate(editId ? '/progreso' : '/', { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editId) return;
    setBusy(true);
    try { await deleteSession(editId); navigate('/progreso', { replace: true }); } catch (e) { setError((e as Error).message); setBusy(false); }
  };

  return (
    <>
      <header className="tv-titleblock">
        <span className="k">{editId ? 'Corregir etapa' : 'Nueva etapa'}</span>
        <h1>{fmtDay(form.date)}</h1>
        <label className="r tv-date">
          cambiar<b>fecha ▾</b>
          <input type="date" value={form.date} max={d.today} aria-label="Fecha de la sesión"
            onChange={(e) => e.target.value && set('date', e.target.value)} />
        </label>
      </header>

      {form.kind === 'grasa' && form.grasaLevel && (
        <div><span className="tv-chip">Sesión guiada · {GRASA[form.grasaLevel].title}</span></div>
      )}

      <div>
        <NumField label="Tiempo" value={form.minutes} onChange={(v) => v != null && set('minutes', v)} step={1} min={1} max={300} unit="min" />
        <NumField label="Distancia" value={form.km} onChange={(v) => v != null && set('km', v)} step={0.1} min={0} max={200} decimals={1} unit="km" hint="la que marca la bici" />
        <NumField label="Pulso promedio" value={form.hrAvg} onChange={(v) => v != null && set('hrAvg', v)} step={1} min={40} max={230} unit="lpm" />
      </div>

      <details className="tv-optional" open={hasOptional || undefined}>
        <summary><div><b>+ Opcionales</b><br /><span>pulso máximo · esfuerzo 1–10 · nota</span></div><span className="chev" aria-hidden="true">▾</span></summary>
        <div className="body">
          <NumField small label="Pulso máximo" value={form.hrMax} onChange={(v) => set('hrMax', v)} step={1} min={40} max={240} unit="lpm"
            nullable start={Math.max(form.hrAvg + 10, 40)} />
          <div>
            <span className="tv-label" id="tv-rpe">Esfuerzo percibido</span>
            <div className="tv-rpe" role="group" aria-labelledby="tv-rpe">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" aria-pressed={form.rpe === n} onClick={() => set('rpe', form.rpe === n ? null : n)}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="tv-label" htmlFor="tv-note">Nota</label>
            <textarea id="tv-note" className="tv-textarea" maxLength={280} value={form.note ?? ''} placeholder="Cómo te sentiste, la bici, la música…"
              onChange={(e) => set('note', e.target.value)} />
          </div>
        </div>
      </details>

      <section className="tv-preview" aria-live="polite">
        <div className="tv-pv-top">
          <div className="big">{fmtInt(steps)}<small>pasos eq</small></div>
          <div className="pct">de tu meta {fmtInt(d.plan.target)}<b className={pct < 0.9 ? 'low' : undefined}>{Math.round(pct * 100)} %</b></div>
        </div>
        <div style={{ marginTop: 8 }}><ZoneBar hr={form.hrAvg} fcmax={fcmax} /></div>
        <p className="tv-note" style={{ fontSize: 14, marginTop: 4 }}>
          Altitud <em>Z{zone} · {Math.round((form.hrAvg / fcmax) * 100)} % de tu FCmáx ({fcmax})</em> — {terrain}.{' '}
          {fmtDec(speedKmh(form.km, form.minutes))} km/h · {fmtDec(efficiency(form.km, form.hrAvg, form.minutes), 2)} m por latido.
        </p>
      </section>

      {error && <p className="tv-error" role="alert">{error}</p>}

      <button type="button" className="tv-cta" onClick={save} disabled={busy}>
        {editId ? 'Guardar cambios' : 'Guardar etapa'} <small>{pct >= 1 ? 'cumbre ✓' : pct >= 0.9 ? 'casi cumbre' : 'avance'}</small>
      </button>
      {editId && (
        <ConfirmButton onConfirm={remove} confirm="¿Seguro? Toca de nuevo para eliminar" disabled={busy}>Eliminar etapa</ConfirmButton>
      )}
    </>
  );
}
