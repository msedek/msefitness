import { useState } from 'react';
import { PLANS, PLAN_ORDER, daysBetween, fmtDate, fmtInt, type PlanId } from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { C, Gate, Icon, Spark } from './svg.tsx';
import { Who } from './ui.tsx';

const ORD = ['1ª', '2ª', '3ª'];

export default function Plan() {
  const { profile, d, updateProfile } = useReady();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const cur = PLAN_ORDER.indexOf(profile.plan);
  const sug = d.planSuggestion;
  const tgt = sug ? PLAN_ORDER.indexOf(sug.to as PlanId) : null;
  const inPlan = d.stats.filter((s) => s.date >= profile.planSince);
  const last10 = inPlan.slice(-10);
  const hits = last10.filter((s) => s.pctTarget >= 0.9).length;
  const weeks = Math.floor(daysBetween(profile.planSince, d.today) / 7);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true); setErr(null);
    try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <>
      <Who kicker="Caja de cambios" title="Tu plan" />
      {sug && <div><span className="tt a blink">{sug.direction === 'subir' ? Icon.up : Icon.down}Cambio a {ORD[tgt!]}</span></div>}

      <div className="pod" style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'minmax(0,130px) 1fr', gap: 12, alignItems: 'center' }}>
        <Gate current={cur} target={tgt} />
        <div>
          <div className="lab">Marcha actual</div>
          <div className="readout" style={{ fontSize: 50, marginTop: 2 }}>{ORD[cur]}<span style={{ fontSize: 19, color: 'var(--ink2)', fontWeight: 500, marginLeft: 6 }}>{d.plan.name}</span></div>
          <div className="note" style={{ marginTop: 4 }}>
            Desde el {fmtDate(profile.planSince)}{weeks > 0 ? ` · ${weeks} ${weeks === 1 ? 'semana' : 'semanas'} en esta marcha` : ''}. {inPlan.length} {inPlan.length === 1 ? 'sesión' : 'sesiones'} en este plan.
          </div>
        </div>
      </div>

      {PLAN_ORDER.map((id, i) => {
        const p = PLANS[id];
        return (
          <div key={id} className={`gear${i === cur ? ' cur' : ''}${i === tgt ? ' next' : ''}`}>
            <div className="n">{i + 1}</div>
            <div>
              <h4>{p.name}{i === cur && <span className="tag">● ACTUAL</span>}{i === tgt && <span className="tag">▲ SUGERIDO</span>}</h4>
              <p>{p.perWeek} ses/sem · {p.minutes[0]}–{p.minutes[1]} min · {p.zoneLabel}</p>
            </div>
            <div className="m" style={id === 'avanzado' ? { color: C.red } : undefined}>{fmtInt(p.target)}<small>{id === 'avanzado' ? 'tope · redline' : 'pasos eq'}</small></div>
          </div>
        );
      })}

      {sug ? (
        <div className="pod pad" style={{ borderColor: '#5a3f0e' }}>
          <div className="lab warn" style={{ marginBottom: 4 }}>
            Indicador de cambio · {sug.direction === 'subir' ? `listo para ${ORD[tgt!]}` : `conviene bajar a ${ORD[tgt!]}`}
          </div>
          {sug.reasons.map((r, i) => (
            <div key={i} className="why">
              <i className={`l${r.ok ? (sug.direction === 'subir' ? ' on' : ' warn') : ''}`} />
              <p>{r.text}</p>
              {sug.direction === 'subir' && i === 0 && <Spark values={last10.map((s) => s.pctTarget)} bars threshold={0.9} />}
              {sug.direction === 'subir' && i === 1 && <Spark values={last10.map((s) => s.hrAvg)} />}
              {sug.direction === 'subir' && i === 2 && <Spark values={last10.map((s) => s.efficiency)} color={C.green} />}
              {sug.direction !== 'subir' && <span />}
            </div>
          ))}
          {err && <div className="err" role="alert" style={{ marginTop: 8 }}>{err}</div>}
          <div className="acts" style={{ marginTop: 10 }}>
            <button type="button" className="ghost" disabled={busy} onClick={() => act(() => updateProfile({ dismiss: 'plan' }))}>Seguir en {ORD[cur]}</button>
            <button type="button" className="go" disabled={busy} onClick={() => act(() => updateProfile({ plan: sug.to as PlanId }))}>Pasar a {PLANS[sug.to as PlanId].name}</button>
          </div>
          <p className="fine" style={{ marginTop: 8 }}>La app sugiere; tú decides. Si dices que no, vuelve a evaluar después de tu próxima sesión.</p>
        </div>
      ) : (
        <div className="pod pad">
          <div className="lab" style={{ marginBottom: 6 }}>Indicador de cambio · en observación</div>
          {cur < 2 ? (
            last10.length < 10
              ? <p className="note">Necesito 10 sesiones en este plan para evaluar un cambio: llevas {inPlan.length}.</p>
              : <p className="note"><b style={{ color: 'var(--ink)' }}>{hits} de 10</b> sesiones recientes sobre el 90 % de la meta. {profile.planDismissedAt
                ? 'Dejaste la sugerencia para después: vuelvo a evaluar con tu próxima sesión.'
                : `Con 7, pulso estable y eficiencia al alza, te sugiero subir a ${ORD[cur + 1]}.`}</p>
          ) : <p className="note">Estás en la marcha más alta: 10.000 pasos equivalentes es el tope del programa.</p>}
          {last10.length > 1 && <div style={{ marginTop: 8 }}><Spark values={last10.map((s) => s.pctTarget)} bars threshold={0.9} /></div>}
        </div>
      )}

      <p className="fine">
        Subir: 90 % de la meta en 7 de las últimas 10 sesiones, con pulso estable y eficiencia al alza. Bajar: 3 de 5 sesiones bajo el 60 % de la meta, o pulso sobre el 85 % de tu FCmáx ({d.alertBpm} lpm) 3 veces seguidas.
      </p>
    </>
  );
}
