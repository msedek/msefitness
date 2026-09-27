import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ALERT_PCT, GRASA, GRASA_ORDER, fmtClock, fmtDate, fmtDec, programMinutes, type GrasaId,
} from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { useGuided } from '../../guided.ts';
import { BlockProfile, LevelDots, ProfileLegend, WeightChart } from './charts.tsx';
import { SuggestionCard } from './Plan.tsx';
import { ConfirmButton, NumField, Sec, TitleBlock } from './ui.tsx';

export default function Quema() {
  const { profile, d, weights, updateProfile, saveWeight, deleteWeight } = useReady();
  const guided = useGuided();
  const navigate = useNavigate();
  const level = profile.grasaLevel;
  const prog = d.grasaProgress;
  const sug = d.grasaSuggestion;
  const nextLevel = GRASA_ORDER[GRASA_ORDER.indexOf(level) + 1] as GrasaId | undefined;
  const lo = Math.round(d.fcmax * 0.6);
  const hi = Math.round(d.fcmax * ALERT_PCT);

  const todayW = weights.find((w) => w.date === d.today);
  const [kg, setKg] = useState<number | null>(todayW?.kg ?? d.currentKg ?? null);
  const [wBusy, setWBusy] = useState(false);
  const [wMsg, setWMsg] = useState<string | null>(null);
  const recent = [...weights].sort((a, z) => z.date.localeCompare(a.date)).slice(0, 5);
  const lost = d.startKg != null && d.currentKg != null ? d.currentKg - d.startKg : null;

  const start = (lv: GrasaId) => { guided.start(lv); navigate('/quema/sesion'); };
  const saveW = async () => {
    if (kg == null) return;
    setWBusy(true);
    setWMsg(null);
    try { await saveWeight({ date: d.today, kg }); setWMsg('Pesaje guardado.'); } catch (e) { setWMsg((e as Error).message); } finally { setWBusy(false); }
  };

  return (
    <>
      <TitleBlock k="Programa guiado" title="Quema de grasa" r={`nivel ${GRASA[level].name.toLowerCase()}`} rb={GRASA[level].title} />

      {guided.active && guided.level ? (
        <section className="tv-guide" aria-label="Sesión guiada en curso">
          <div className="top"><span>En ruta · {GRASA[guided.level].title}</span><span>{fmtClock(guided.elapsedSec)} de {fmtClock(guided.totalSec)}</span></div>
          <div className="mid">
            <div className="clock">{fmtClock(guided.blockRemainingSec)}</div>
            <div className="blk"><b>Bloque {guided.blockIndex + 1} de {guided.blocks.length}</b><span>{guided.block?.label} · {guided.running ? 'en marcha' : guided.finished ? 'terminada' : 'en pausa'}</span></div>
          </div>
          <BlockProfile blocks={guided.blocks} maxMin={guided.totalSec / 60} H={52} cursorSec={guided.elapsedSec} dark />
          <div className="ctrl"><Link to="/quema/sesion" className="pri">Continuar sesión</Link><span /></div>
        </section>
      ) : (
        <button type="button" className="tv-cta" onClick={() => start(level)}>
          Iniciar {GRASA[level].title} <small>{programMinutes(GRASA[level])} min · guiada</small>
        </button>
      )}
      <p className="tv-note s" style={{ marginTop: -8 }}>
        La app te guía bloque a bloque con el rango de pulso a mantener. Al terminar se pre-llena tu registro; tú anotas distancia y pulso promedio.
      </p>

      {sug && (
        <SuggestionCard sug={sug} evidence={[]}
          title={sug.direction === 'subir' ? `Listo para ${GRASA[sug.to as GrasaId].title}` : `Conviene volver a ${GRASA[sug.to as GrasaId].title}`}
          accept={`${sug.direction === 'subir' ? 'Subir' : 'Bajar'} a ${GRASA[sug.to as GrasaId].name}`}
          keep={`Seguir en ${GRASA[level].name}`}
          footer="La app sugiere; tú decides. El avance del nivel vuelve a contar desde cero."
          onAccept={() => updateProfile({ grasaLevel: sug.to as GrasaId })}
          onDismiss={() => updateProfile({ dismiss: 'grasa' })} />
      )}

      <section aria-labelledby="tv-q-rutas">
        <Sec id="tv-q-rutas" title="Tres rutas" aside="la forma de cada sesión" />
        <div className="tv-routes">
          {GRASA_ORDER.map((id) => {
            const g = GRASA[id];
            const cur = id === level;
            return (
              <div key={id} className={`tv-rt${cur ? ' cur' : ''}`} aria-current={cur || undefined}>
                <div className="h"><b>{g.name}<i>{g.title}{cur ? ' — tu nivel' : ''}</i></b><span>{programMinutes(g)} min · {g.perWeek}/sem</span></div>
                <BlockProfile blocks={g.blocks} maxMin={45} label={`${g.title}: ${programMinutes(g)} minutos, ${g.blocks.length} bloques`} />
                <p className="tv-note s" style={{ padding: '2px 0 4px' }}>{g.note}</p>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 6 }}><ProfileLegend /></div>
      </section>

      <section aria-labelledby="tv-q-avance">
        <Sec id="tv-q-avance" title="Avance del nivel" aside={`${Math.min(prog.completed, prog.needed)} de ${prog.needed} sesiones`} />
        <LevelDots completed={prog.completed} needed={prog.needed} />
        <p className="tv-note s">
          {nextLevel
            ? <>Subes a <em>{GRASA[nextLevel].title}</em> con {prog.needed} sesiones completas: la duración entera y el pulso promedio entre {lo} y {hi} lpm (60–85 % de tu FCmáx).</>
            : <>Estás en el nivel más alto. Una sesión cuenta como completa con la duración entera y el pulso promedio entre {lo} y {hi} lpm.</>}
        </p>
      </section>

      <section aria-labelledby="tv-q-peso">
        <div className="tv-kv" id="tv-q-peso">
          <div className="n">{d.currentKg != null ? fmtDec(d.currentKg) : '—'}<small>kg</small></div>
          <div className="t">peso semanal{lost != null && weights.length > 1 && <><br /><span className={`tv-delta${lost > 0 ? ' bad' : ''}`}>{lost > 0 ? '+' : '−'}{fmtDec(Math.abs(lost))} kg</span> desde {fmtDate([...weights].sort((a, z) => a.date.localeCompare(z.date))[0].date)}</>}
            {d.bmi != null && <><br />IMC {fmtDec(d.bmi)}</>}</div>
        </div>
        {d.weights.length > 0 ? <WeightChart points={d.weights} /> : <div className="tv-empty">Registra tu primer pesaje para ver la ladera.</div>}
        <p className="tv-note" style={{ fontSize: 14 }}>Bajar de peso depende sobre todo del déficit calórico: la bici suma, la mesa decide.</p>

        <div style={{ marginTop: 6 }}>
          <NumField label={todayW ? 'Pesaje de hoy (actualizar)' : 'Pesaje de hoy'} value={kg} onChange={setKg} step={0.1} min={30} max={300} decimals={1} unit="kg" start={d.currentKg ?? 80} />
          <button type="button" className="tv-btn2" style={{ marginTop: 10 }} disabled={kg == null || wBusy} onClick={saveW}>
            {todayW ? 'Actualizar pesaje' : 'Registrar pesaje'}
          </button>
          {wMsg && <p className="tv-note s" role="status" style={{ marginTop: 6 }}>{wMsg}</p>}
        </div>

        {recent.length > 0 && (
          <div className="tv-weights" style={{ marginTop: 12 }} aria-label="Últimos pesajes">
            {recent.map((w) => (
              <div key={w.id}>
                <span>{fmtDate(w.date)}</span>
                <b>{fmtDec(w.kg)} kg</b>
                <ConfirmButton className="" confirm="Borrar" onConfirm={() => void deleteWeight(w.id)}>
                  <span aria-label={`Borrar pesaje del ${fmtDate(w.date)}`}>✕</span>
                </ConfirmButton>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
