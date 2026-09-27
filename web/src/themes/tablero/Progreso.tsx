import { useState } from 'react';
import { Link } from 'react-router';
import {
  GRASA, PLANS, addDays, daysBetween, fmtDate, fmtDay, fmtDec, fmtInt, weekStart, zoneMinutes, type Zone,
} from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { Disc, EffGauge, Odo, Scope, ZONE_COLOR } from './svg.tsx';
import { Who } from './ui.tsx';

type Range = 4 | 6 | 0;
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function Progreso() {
  const { d, profile } = useReady();
  const [range, setRange] = useState<Range>(6);
  const from = range ? addDays(weekStart(d.today), -(range - 1) * 7) : d.stats[0]?.date ?? d.today;
  const stats = d.stats.filter((s) => s.date >= from);
  const n = stats.length;
  const first = stats[0], last = stats[n - 1];
  const goal = PLANS[profile.plan].perWeek;

  // Semanas del calendario (lunes a domingo), de la más antigua a la actual.
  const weeks: string[] = [];
  for (let w = weekStart(from); w <= d.today; w = addDays(w, 7)) weeks.push(w);
  const byDate = new Map<string, typeof stats>();
  for (const s of stats) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
  const km = stats.reduce((a, s) => a + s.km, 0);
  const nWeeks = Math.max(1, Math.ceil((daysBetween(from, d.today) + 1) / 7));
  const zm = zoneMinutes(stats);
  const zTot = Object.values(zm).reduce((a, b) => a + b, 0);
  const effPct = first && last && first.efficiency ? (last.efficiency / first.efficiency - 1) * 100 : 0;
  const rec = d.records;

  return (
    <>
      <Who kicker={`${n} ${n === 1 ? 'sesión' : 'sesiones'}`} title="Progreso" />
      <div className="key" role="group" aria-label="Rango" style={{ alignSelf: 'flex-start' }}>
        {([[4, '4 semanas'], [6, '6 semanas'], [0, 'Todo']] as [Range, string][]).map(([r, l]) => (
          <button type="button" key={r} className={range === r ? 'on' : ''} aria-pressed={range === r} onClick={() => setRange(r)}>{l}</button>
        ))}
      </div>

      {n === 0 ? (
        <div className="pod empty">
          <div className="lab warn">Sin registros en este rango</div>
          <p className="note">Cuando registres sesiones, aquí verás el tacógrafo, tu pulso, la eficiencia y la constancia.</p>
          <Link to="/registrar" className="go" style={{ display: 'grid', placeItems: 'center', marginTop: 14 }}>Registrar sesión</Link>
        </div>
      ) : <>
        <div className="pod" style={{ padding: '10px 10px', display: 'grid', gridTemplateColumns: 'minmax(0,150px) 1fr', gap: 10, alignItems: 'center' }}>
          <Disc values={stats.map((s) => s.steps)} target={d.plan.target} />
          <div>
            <div className="lab">Tacógrafo</div>
            <div className="big" style={{ marginTop: 6, fontSize: n > 1 ? 26 : 30 }}>{n > 1 ? `${fmtInt(first.steps)} → ${fmtInt(last.steps)}` : fmtInt(last.steps)}</div>
            <p className="note" style={{ marginTop: 6, fontSize: 12 }}>
              Cada rayo es una sesión, en sentido horario desde el {fmtDate(first.date)}. {d.plan.target < 10000 ? `El anillo ámbar es tu meta de ${fmtInt(d.plan.target)}; el rojo, el tope de 10.000.` : 'El anillo rojo es tu meta y el tope: 10.000.'}
            </p>
          </div>
        </div>

        <div className="pod" style={{ paddingBottom: 6 }}>
          <div className="between" style={{ padding: '10px 12px 0' }}>
            <span className="lab">Pulso promedio</span>
            <span className="big" style={{ fontSize: 22 }}>{n > 1 ? `${first.hrAvg} → ${last.hrAvg}` : last.hrAvg}<small>lpm</small></span>
          </div>
          <Scope values={stats.map((s) => s.hrAvg)} alert={d.alertBpm} first={fmtDate(first.date).toUpperCase()} last={fmtDate(last.date).toUpperCase()} />
        </div>

        <div className="row">
          <div className="pod" style={{ flex: 1.1, padding: '10px 6px 8px' }}>
            <div className="lab" style={{ textAlign: 'center' }}>Eficiencia</div>
            <EffGauge first={first.efficiency} last={last.efficiency} />
            <div className="note" style={{ textAlign: 'center', fontSize: 11.5 }}>
              {n > 1 ? <><b className={effPct >= 0 ? 'up' : 'hot'}>{effPct >= 0 ? '+' : ''}{fmtInt(effPct)} %</b> · tenue = {fmtDate(first.date)}</> : 'm por latido'}
            </div>
          </div>
          <div className="pod" style={{ flex: 1, padding: '10px 10px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
            <div className="lab">Odo · acumulado</div>
            <Odo km={d.totalKm} digits={4} />
            <div className="note" style={{ fontSize: 11.5 }}>
              Media semanal {fmtDec(km / nWeeks, 1)} km{rec.farthest && <><br />Récord: {fmtDec(rec.farthest.km, 1)} km · {fmtDate(rec.farthest.date)}</>}
            </div>
          </div>
        </div>

        <div className="pod">
          <div className="between" style={{ padding: '10px 12px 4px' }}>
            <span className="lab">Constancia</span>
            <span className="lab up">● {goal}+ por semana</span>
          </div>
          <div className="cal" role="table" aria-label="Calendario de sesiones">
            <span className="w" />{DAYS.map((x, i) => <span key={i} className="d">{x}</span>)}<span />
            {weeks.map((w) => {
              const count = stats.filter((s) => s.date >= w && s.date < addDays(w, 7)).length;
              return [
                <span key={`${w}l`} className="w">{`${Number(w.slice(8))}/${Number(w.slice(5, 7))}`}</span>,
                ...Array.from({ length: 7 }, (_, k) => {
                  const day = addDays(w, k), ss = byDate.get(day);
                  const cls = ss ? (ss.some((s) => s.kind === 'grasa') ? 'g' : 's') : day === d.today ? 'today' : day > d.today ? 'fut' : '';
                  return <i key={day} className={cls} title={ss ? `${fmtDay(day)}: ${ss.length} sesión` : fmtDay(day)} />;
                }),
                count >= goal ? <span key={`${w}o`} className="ok" aria-label="semana cumplida" /> : <span key={`${w}o`} />,
              ];
            })}
          </div>
          <p className="fine" style={{ padding: '0 12px 10px' }}>Ámbar: sesión libre · verde: sesión guiada de quema.</p>
        </div>

        {zTot > 0 && (
          <div className="pod pad">
            <div className="between" style={{ marginBottom: 8 }}><span className="lab">Tiempo por zona</span><span className="lab">{fmtInt(zTot)} min</span></div>
            <div className="zbar" role="img" aria-label="Distribución del tiempo por zona de pulso">
              {([1, 2, 3, 4, 5] as Zone[]).filter((z) => zm[z] > 0).map((z) => (
                <span key={z} style={{ width: `${zm[z] / zTot * 100}%`, background: ZONE_COLOR[z] }}>{zm[z] / zTot > 0.12 ? `Z${z} · ${fmtInt(zm[z] / zTot * 100)} %` : `Z${z}`}</span>
              ))}
            </div>
          </div>
        )}

        {rec.longest && (
          <div className="pod pad">
            <div className="lab" style={{ marginBottom: 8 }}>Récords · de siempre</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px' }}>
              <div><div className="readout" style={{ fontSize: 28 }}>{fmtInt(rec.longest.minutes)}<small>min</small></div><div className="fine">{fmtDate(rec.longest.date)}</div></div>
              <div><div className="readout" style={{ fontSize: 28 }}>{fmtDec(rec.farthest!.km, 1)}<small>km</small></div><div className="fine">{fmtDate(rec.farthest!.date)}</div></div>
              <div><div className="readout" style={{ fontSize: 28 }}>{fmtInt(rec.mostSteps!.steps)}<small>pasos</small></div><div className="fine">{fmtDate(rec.mostSteps!.date)}</div></div>
              <div><div className="readout" style={{ fontSize: 28 }}>{fmtDec(rec.bestEfficiency!.efficiency, 2)}<small>m/l</small></div><div className="fine">{fmtDate(rec.bestEfficiency!.date)}</div></div>
            </div>
          </div>
        )}

        <div className="pod">
          <div className="between" style={{ padding: '10px 12px 2px' }}><span className="lab">Bitácora</span><span className="lab">toca para editar</span></div>
          <div className="hist">
            {[...stats].reverse().map((s) => (
              <Link key={s.id} to={`/registrar?id=${s.id}`}>
                <div className="dt">{fmtDay(s.date).split(' ')[0]}<b>{fmtDate(s.date)}</b></div>
                <div className="vals">
                  {fmtInt(s.minutes)} min · {fmtDec(s.km, 1)} km · {s.hrAvg} lpm
                  <br /><span>{s.kind === 'grasa' && s.grasaLevel ? `Guiada · ${GRASA[s.grasaLevel].title} · ` : ''}Z{s.zone} · {fmtDec(s.efficiency, 2)} m/latido</span>
                </div>
                <div className={`st${s.alert ? ' hot' : ''}`}>{fmtInt(s.steps)}<small className={s.pctTarget >= 0.9 ? 'up' : 'muted'}>{fmtInt(s.pctTarget * 100)} %</small></div>
              </Link>
            ))}
          </div>
        </div>
      </>}
    </>
  );
}
