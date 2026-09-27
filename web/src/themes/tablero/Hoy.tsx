import { Link, useNavigate } from 'react-router';
import { GRASA, fmtDay, fmtDec, fmtInt, zoneOf } from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { useGuided } from '../../guided.ts';
import { C, Icon, Odo, SmallGauge, Tach } from './svg.tsx';
import { Telltale, Who } from './ui.tsx';

export default function Hoy() {
  const { profile, d } = useReady();
  const guided = useGuided();
  const nav = useNavigate();
  const last = d.last;
  const sug = d.planSuggestion;
  const pct = last ? Math.round(last.pctTarget * 100) : 0;

  // Rango del medidor de pulso según la FCmáx de la persona.
  const gMin = Math.floor(d.fcmax * 0.55 / 10) * 10;
  const gMax = Math.ceil(d.fcmax / 10) * 10;
  const gMid = Math.round((gMin + gMax) / 20) * 10;
  const recordNote = last && [
    d.records.farthest?.id === last.id && 'distancia',
    d.records.longest?.id === last.id && 'duración',
  ].filter(Boolean);

  return (
    <>
      <Who kicker={fmtDay(d.today)} title={`Hola, ${profile.name}`} />

      <div className="telltales">
        <Telltale on={d.streak > 0} tone="g" icon={Icon.flame}>{d.streak > 0 ? `Racha ${d.streak} sem` : 'Racha'}</Telltale>
        {sug
          ? <Link to="/plan"><Telltale on tone="a" blink icon={sug.direction === 'subir' ? Icon.up : Icon.down}>{sug.direction === 'subir' ? 'Subir nivel' : 'Bajar nivel'}</Telltale></Link>
          : <Telltale on={false} icon={Icon.up}>Nivel</Telltale>}
        <Telltale on={!!last?.alert} tone="r" blink icon={Icon.heart}>Pulso</Telltale>
      </div>

      {guided.active && guided.level && (
        <Link to="/quema/sesion" className="pod pad between" style={{ borderColor: '#5a3f0e' }}>
          <span><span className="lab warn">Guiada en curso</span><br /><b style={{ fontStretch: '80%', fontSize: 17 }}>{GRASA[guided.level].title}</b></span>
          <span className="tt a">{Icon.play}Continuar</span>
        </Link>
      )}

      <div className="pod" style={{ padding: '6px 0 12px' }}>
        <Tach
          steps={last?.steps ?? null}
          target={d.plan.target}
          readout={last ? fmtInt(last.steps) : '—'}
          sub={last ? `${pct} % DE LA META` : `META ${fmtInt(d.plan.target)}`}
          subColor={last && last.pctTarget >= 1 ? C.green : C.amber}
          foot={last ? `ÚLTIMA SESIÓN · Z${last.zone}` : 'SIN SESIONES AÚN'}
        />
        <div className="between" style={{ padding: '0 16px', marginTop: -4, alignItems: 'center' }}>
          <div><div className="lab">Odo · total</div><div style={{ marginTop: 5 }}><Odo km={d.totalKm} /></div></div>
          <div style={{ textAlign: 'right' }}>
            <div className="lab">Trip · semana</div>
            <div className="readout" style={{ fontSize: 28, marginTop: 4 }}>{fmtDec(d.week.km, 1)}<small>km</small></div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="pod" style={{ flex: 1, padding: '9px 6px 6px' }}>
          <div className="lab" style={{ textAlign: 'center' }}>Semana</div>
          <SmallGauge
            label="Sesiones de la semana" min={0} max={d.week.goal} val={Math.min(d.week.done, d.week.goal)}
            ticks={Array.from({ length: d.week.goal + 1 }, (_, i) => i)}
            labels={{ 0: '0', [d.week.goal]: String(d.week.goal) }}
            color={C.green} valText={`${d.week.done} / ${d.week.goal}`}
            sub={d.week.done >= d.week.goal ? 'SEMANA CUMPLIDA' : `FALTAN ${d.week.goal - d.week.done}`}
          />
        </div>
        <div className="pod" style={{ flex: 1, padding: '9px 6px 6px' }}>
          <div className="lab" style={{ textAlign: 'center' }}>Pulso</div>
          <SmallGauge
            label="Pulso promedio de la última sesión" min={gMin} max={gMax} val={last?.hrAvg ?? null}
            ticks={Array.from({ length: (gMax - gMin) / 10 + 1 }, (_, i) => gMin + i * 10)}
            labels={{ [gMin]: String(gMin), [gMid]: String(gMid), [gMax]: String(gMax) }}
            red={[d.alertBpm, gMax]}
            valText={last ? `${last.hrAvg} lpm` : '—'}
            sub={last ? `${Math.round(last.pctFcmax * 100)} % FCMÁX · Z${zoneOf(last.hrAvg, last.fcmax)}` : `FCMÁX ${d.fcmax}`}
          />
        </div>
      </div>

      <div className="row" style={{ alignItems: 'center', gap: 14, padding: '2px 2px 0' }}>
        <div style={{ flex: 1 }}>
          {last ? <>
            <div className="lab">Última sesión · {fmtDay(last.date)}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              <div className="readout" style={{ fontSize: 30 }}>{fmtInt(last.minutes)}<small>min</small></div>
              <div className="readout" style={{ fontSize: 30 }}>{fmtDec(last.km, 1)}<small>km</small></div>
              <div className="readout" style={{ fontSize: 30 }}>{last.hrAvg}<small>lpm</small></div>
            </div>
            <div className="note" style={{ marginTop: 5 }}>
              {last.kcal != null && <>≈ {fmtInt(last.kcal)} kcal estimado</>}
              {recordNote && recordNote.length > 0 && <> · récord de {recordNote.join(' y ')}</>}
              {last.alert && <span className="hot"> · pulso sobre el 85 %</span>}
            </div>
          </> : <>
            <div className="lab warn">Primera vuelta</div>
            <p className="note" style={{ marginTop: 6 }}>
              Registra tu primera sesión: tiempo, distancia y pulso promedio. Tu meta en el plan {d.plan.name} es {fmtInt(d.plan.target)} pasos equivalentes, {d.plan.perWeek} veces por semana.
            </p>
          </>}
        </div>
        <button type="button" className="btn-start" onClick={() => nav('/registrar')} aria-label="Registrar sesión">
          <span>Registrar<strong>START</strong>sesión</span>
        </button>
      </div>
    </>
  );
}
