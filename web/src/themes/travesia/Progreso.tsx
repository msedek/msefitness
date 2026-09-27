import { useState } from 'react';
import { Link } from 'react-router';
import {
  GRASA, addDays, fmtDate, fmtDay, fmtDec, fmtInt, weekStart, zoneMinutes, type Zone,
} from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { Calendar, ElevationProfile, RouteMap, Spark, ZoneTime } from './charts.tsx';
import { ZC } from './palette.ts';
import { Sec, TitleBlock } from './ui.tsx';

type Range = 4 | 6 | 0;
const RANGES: [Range, string][] = [[4, '4 sem'], [6, '6 sem'], [0, 'Todo']];

export default function Progreso() {
  const { d } = useReady();
  const [range, setRange] = useState<Range>(6);
  const from = range ? addDays(weekStart(d.today), -7 * (range - 1)) : null;
  const stats = from ? d.stats.filter((s) => s.date >= from) : d.stats;
  const n = stats.length;
  const km = stats.reduce((a, s) => a + s.km, 0);

  // Semanas del calendario: las del rango (con "Todo", hasta 16 semanas hacia atrás desde la primera sesión).
  const first = from ?? (d.stats[0] ? weekStart(d.stats[0].date) : weekStart(d.today));
  const weekStarts: string[] = [];
  for (let ws = first; ws <= d.today; ws = addDays(ws, 7)) weekStarts.push(ws);
  const weeks = weekStarts.slice(-16);

  const zm = zoneMinutes(stats);
  const totMin = (Object.values(zm) as number[]).reduce((a, b) => a + b, 0);
  const inTarget = stats.filter((s) => d.plan.zones.includes(s.zone)).length;
  const r = d.records;
  const hr = stats.map((s) => s.hrAvg);
  const eff = stats.map((s) => s.efficiency);
  const dates = stats.map((s) => s.date);
  const zr = d.zones;
  const hrBands: [number, number, string, string][] = ([2, 3, 4, 5] as Zone[]).map((z) => [zr[z][0], zr[z][1], ZC[z], `Z${z}`]);

  return (
    <>
      <TitleBlock k="Carta de progreso" title={n ? `${fmtDate(stats[0].date)} — ${fmtDate(stats[n - 1].date)}` : 'Carta en blanco'}
        r={`${n} ${n === 1 ? 'etapa' : 'etapas'}`} rb={`${fmtDec(km)} km`} />

      <div className="tv-filter" role="group" aria-label="Rango de tiempo">
        {RANGES.map(([v, t]) => <button key={t} type="button" aria-pressed={range === v} onClick={() => setRange(v)}>{t}</button>)}
      </div>

      {n === 0 ? (
        <div className="tv-empty">Sin etapas en este rango. Cada sesión que registres dibuja el relieve de esta carta.</div>
      ) : (
        <>
          <section aria-labelledby="tv-p-perfil">
            <Sec id="tv-p-perfil" title="Perfil · pasos eq" aside={`cota ${fmtInt(d.plan.target)} = tu meta`} />
            <ElevationProfile stats={stats} target={d.plan.target} />
          </section>

          <section aria-label="Pulso promedio">
            <div className="tv-kv">
              <div className="n">{hr[n - 1]}<small>lpm</small></div>
              <div className="t">pulso promedio{n > 1 && <><br /><span className={`tv-delta${hr[n - 1] > hr[0] ? ' bad' : ''}`}>{hr[n - 1] - hr[0] > 0 ? '+' : hr[n - 1] < hr[0] ? '−' : ''}{Math.abs(hr[n - 1] - hr[0])} lpm</span> desde {hr[0]}</>}</div>
            </div>
            <Spark values={hr} dates={dates} bands={hrBands} alert={d.alertBpm} unit="lpm" />
            {n > 2 && (
              <p className="tv-note" style={{ fontSize: 14 }}>
                {hr[n - 1] < hr[0] ? 'El terreno se aplana: mismo esfuerzo, menos pulso.' : hr[n - 1] > hr[0] ? 'El terreno se empina: vigila que no pase de la alerta.' : 'Pulso estable.'}
              </p>
            )}
          </section>

          <section aria-label="Eficiencia cardíaca">
            <div className="tv-kv">
              <div className="n">{fmtDec(eff[n - 1], 2)}<small>m / latido</small></div>
              <div className="t">eficiencia cardíaca{n > 1 && eff[0] > 0 && <><br /><span className={`tv-delta${eff[n - 1] < eff[0] ? ' bad' : ''}`}>{eff[n - 1] >= eff[0] ? '+' : ''}{Math.round((eff[n - 1] / eff[0] - 1) * 100)} %</span> desde {fmtDec(eff[0], 2)}</>}</div>
            </div>
            <Spark values={eff} dates={dates} H={80} fmt={(v) => fmtDec(v, 2)} unit="m/latido" />
            <p className="tv-note s">Más kilómetros con el mismo corazón: si sube, tu base aeróbica mejora.</p>
          </section>
        </>
      )}

      <section aria-labelledby="tv-p-ruta">
        <Sec id="tv-p-ruta" title="Travesía · Ruta 5 Sur" aside="distancias aprox." />
        <RouteMap totalKm={d.totalKm} />
      </section>

      <section aria-labelledby="tv-p-const">
        <Sec id="tv-p-const" title="Constancia" aside={`racha: ${d.streak} ${d.streak === 1 ? 'semana' : 'semanas'}`} />
        <Calendar stats={stats} weekStarts={weeks} goal={d.plan.perWeek} />
      </section>

      {n > 0 && (
        <section aria-labelledby="tv-p-zonas">
          <Sec id="tv-p-zonas" title="Tiempo por zona" aside={`${fmtInt(totMin)} min en total`} />
          <ZoneTime minutes={zm} />
          <p className="tv-note s" style={{ marginTop: 4 }}>
            {([1, 2, 3, 4, 5] as Zone[]).filter((z) => zm[z] > 0).map((z) => `Z${z} ${fmtInt(zm[z])} min`).join(' · ')}.{' '}
            {inTarget} de {n} etapas en tu zona objetivo ({d.plan.zoneLabel}).
          </p>
        </section>
      )}

      {r.longest && r.farthest && r.bestEfficiency && (
        <section aria-labelledby="tv-p-rec">
          <Sec id="tv-p-rec" title="Cotas máximas" aside="récords" />
          <div className="tv-recs">
            <div><b>{fmtInt(r.longest.minutes)} min</b><small>más larga</small><i>{fmtDate(r.longest.date)}</i></div>
            <div><b>{fmtDec(r.farthest.km)} km</b><small>más lejos</small><i>{fmtDate(r.farthest.date)}</i></div>
            <div><b>{fmtDec(r.bestEfficiency.efficiency, 2)}</b><small>m / latido</small><i>{fmtDate(r.bestEfficiency.date)}</i></div>
          </div>
        </section>
      )}

      {n > 0 && (
        <section aria-labelledby="tv-p-log">
          <Sec id="tv-p-log" title="Bitácora de etapas" aside="toca para corregir" />
          <div className="tv-log">
            {[...stats].reverse().map((s) => (
              <Link key={s.id} to={`/registrar?id=${s.id}`}>
                <span className="d"><b>{fmtDate(s.date).split(' ')[0]}</b>{fmtDay(s.date).split(' ')[0]} {fmtDate(s.date).split(' ')[1]}</span>
                <span className="m">
                  {fmtInt(s.minutes)} min · {fmtDec(s.km)} km · {s.hrAvg} lpm
                  <i><em className="tv-zchip" style={{ background: ZC[s.zone] }}>Z{s.zone}</em>{s.kind === 'grasa' && s.grasaLevel ? `guiada · ${GRASA[s.grasaLevel].title}` : s.note ?? ''}{s.alert ? ' · alerta de pulso' : ''}</i>
                </span>
                <span className="s">{fmtInt(s.steps)}<small>{Math.round(s.pctTarget * 100)} % meta</small></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
