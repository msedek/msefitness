import { Link } from 'react-router';
import { GRASA, PLANS, fmtDay, fmtDec, fmtInt, fmtPct, type PlanId } from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { useGuided } from '../../guided.ts';
import { MiniStrip, Summit, WeekTrail } from './charts.tsx';
import { ALTURA } from './palette.ts';
import { posicion } from './ruta.ts';
import { Descent, Mountain, Sec, TitleBlock } from './ui.tsx';

export default function Hoy() {
  const { profile, d } = useReady();
  const guided = useGuided();
  const last = d.last;
  const p = posicion(d.totalKm);
  const sug = d.planSuggestion;
  const gsug = d.grasaSuggestion;
  const week = d.week;
  const weekText = week.done >= week.goal ? `${week.done} de ${week.goal} · plan cumplido` : `${week.done} de ${week.goal} etapas`;

  return (
    <>
      <TitleBlock k={`Bitácora · plan ${d.plan.name.toLowerCase()}`} title={`Hola, ${profile.name}`} r={fmtDay(d.today)} rb={ALTURA[profile.plan].name} />

      <section aria-labelledby="tv-h-cumbre">
        <Sec id="tv-h-cumbre" title="Última cumbre" aside={last ? fmtDay(last.date) : 'sin etapas aún'} />
        <Summit steps={last?.steps ?? null} target={d.plan.target} />
        {last ? (
          <>
            <div className="tv-stats">
              <div><b>{fmtInt(last.minutes)}</b><small>min</small></div>
              <div><b>{fmtDec(last.km)}</b><small>km</small></div>
              <div><b>{last.hrAvg}</b><small>lpm</small></div>
              <div><b>Z{last.zone}</b><small>{fmtPct(last.pctFcmax)}</small></div>
            </div>
            <p className="tv-note s" style={{ marginTop: 5 }}>
              {last.kcal != null && <>≈ {fmtInt(last.kcal)} kcal <em>(estimado)</em> · </>}
              {fmtDec(last.speed)} km/h · {fmtDec(last.efficiency, 2)} m por latido
              {last.alert && <> · <b style={{ color: 'var(--route)' }}>pulso sobre el 85 %</b></>}
            </p>
          </>
        ) : (
          <p className="tv-note">Tu primera cumbre te espera: la meta del plan {d.plan.name} son <b>{fmtInt(d.plan.target)} pasos eq</b>, unos {d.plan.minutes[0]}–{d.plan.minutes[1]} min en {d.plan.zoneLabel}.</p>
        )}
      </section>

      <section aria-labelledby="tv-h-semana">
        <Sec id="tv-h-semana" title="Etapas de la semana" aside={weekText} />
        <WeekTrail days={week.days} today={d.today} target={d.plan.target} />
      </section>

      <section aria-labelledby="tv-h-ruta">
        <Sec id="tv-h-ruta" title={p.vuelta > 1 ? `Ruta 5 · vuelta ${p.vuelta}` : 'Travesía Ruta 5'} aside={`${fmtDec(d.totalKm)} km acumulados`} />
        <MiniStrip totalKm={d.totalKm} />
        <p className="tv-note" style={{ marginTop: 4 }}>
          {d.totalKm === 0 ? (
            <>Partes en <em>Santiago</em>. Próximo hito: <em>{p.next?.[0]}</em>, a ≈{p.next?.[1]} km (aprox.).</>
          ) : p.next ? (
            <>{p.prev[1] === 0 && p.vuelta === 1 ? 'Saliste de' : 'Pasaste'} <em>{p.prev[0]}</em>. Te quedan ≈{fmtInt(Math.max(1, p.next[1] - p.km))} km para <em>{p.next[0]}</em>.</>
          ) : (
            <>Llegaste a <em>{p.prev[0]}</em>, fin de la Ruta 5.</>
          )}
        </p>
      </section>

      {guided.active && guided.level && (
        <Link to="/quema/sesion" className="tv-teaser warn">
          <Mountain />
          <div><b>Sesión guiada en curso</b><span>{GRASA[guided.level].title} · {guided.running ? 'en marcha' : guided.finished ? 'terminada, falta registrarla' : 'en pausa'}</span></div>
          <div className="go">→</div>
        </Link>
      )}

      {sug && (
        <Link to="/plan" className={`tv-teaser${sug.direction === 'bajar' ? ' warn' : ''}`}>
          {sug.direction === 'subir' ? <Mountain /> : <Descent />}
          <div>
            <b>{sug.direction === 'subir' ? `Paso abierto a ${ALTURA[sug.to as PlanId].name}` : `Conviene bajar al ${ALTURA[sug.to as PlanId].name}`}</b>
            <span>tus datos dicen: {sug.direction === 'subir' ? 'listo para' : 'volver a'} {PLANS[sug.to as PlanId].name}</span>
          </div>
          <div className="go">→</div>
        </Link>
      )}
      {gsug && (
        <Link to="/quema" className={`tv-teaser${gsug.direction === 'bajar' ? ' warn' : ''}`}>
          {gsug.direction === 'subir' ? <Mountain /> : <Descent />}
          <div>
            <b>Quema de grasa: {gsug.direction === 'subir' ? 'sube' : 'baja'} a {GRASA[gsug.to as keyof typeof GRASA].title}</b>
            <span>{gsug.reasons[0]?.text}</span>
          </div>
          <div className="go">→</div>
        </Link>
      )}

      <Link to="/registrar" className="tv-cta">Registrar sesión <small>hoy, {fmtDay(d.today)}</small></Link>
    </>
  );
}
