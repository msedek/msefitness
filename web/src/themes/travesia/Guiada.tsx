import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { GRASA, bpmRange, fmtClock } from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { useGuided } from '../../guided.ts';
import { BlockProfile, HrGauge } from './charts.tsx';

const TRAMO: Record<number, string> = { 1: 'llano', 2: 'fondo', 3: 'subida corta', 4: 'repecho', 5: 'muro' };

export default function Guiada() {
  const { d } = useReady();
  const g = useGuided();
  const navigate = useNavigate();
  const [hr, setHr] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Al terminar/descartar se limpia la sesión y se navega: sin esto el <Navigate> de abajo
  // (sin sesión activa → /quema) ganaría a la navegación hacia /registrar.
  const [leaving, setLeaving] = useState(false);

  if (leaving) return null;
  if (!g.active || !g.level || !g.block) return <Navigate to="/quema" replace />;

  const program = GRASA[g.level];
  const range = g.rangeFor(d.fcmax)!;
  const status = hr != null ? g.checkHr(hr, d.fcmax) : null;
  const next = g.next;
  const nextRange = next ? bpmRange(next.range, d.fcmax) : null;
  const remaining = g.totalSec - g.elapsedSec;

  const finish = () => {
    const r = g.finish();
    setLeaving(true);
    if (r) navigate('/registrar', { replace: true, state: { prefill: { minutes: r.minutes, kind: 'grasa', grasaLevel: r.level } } });
  };
  const discard = () => { g.cancel(); setLeaving(true); navigate('/quema', { replace: true }); };

  return (
    <div className="tv tv-full">
      <div className="inner">
        <div className="hd"><span>En ruta · modo guiado</span><span>{fmtClock(g.elapsedSec)} de {fmtClock(g.totalSec)}</span></div>
        <h1>{program.title}</h1>

        {g.finished ? (
          <div role="status" aria-live="polite">
            <div className="clock" style={{ fontSize: 'clamp(64px, 20vw, 110px)' }}>Cumbre</div>
            <p className="tv-note" style={{ color: 'var(--paper-3)', marginTop: 8 }}>
              Sesión completa: {Math.round(g.totalSec / 60)} min. Registra la distancia y el pulso promedio que marcó la bici.
            </p>
          </div>
        ) : (
          <>
            <div aria-live="off">
              <div className="clock" role="timer" aria-label={`Quedan ${fmtClock(g.blockRemainingSec)} en este bloque`}>{fmtClock(g.blockRemainingSec)}</div>
            </div>
            <div className="blk">
              <div>
                <b style={{ color: `var(--z${g.block.zone})` }}>Bloque {g.blockIndex + 1} de {g.blocks.length}</b>
                <span>{TRAMO[g.block.zone]} · {g.block.label}</span>
              </div>
              <div className="range"><small>mantén</small>{range[0]}–{range[1]}<small>lpm</small></div>
            </div>
            <HrGauge fcmax={d.fcmax} range={range} hr={hr} />
          </>
        )}

        <BlockProfile blocks={g.blocks} maxMin={g.totalSec / 60} H={70} cursorSec={g.elapsedSec} dark
          label={`Perfil de ${program.title}, vas en el minuto ${Math.floor(g.elapsedSec / 60)}`} />

        {!g.finished && (
          <>
            <div className="next">
              {next && nextRange
                ? <><span>Después: <b>{next.minutes}′ Z{next.zone}</b> · {nextRange[0]}–{nextRange[1]} lpm</span><i>{TRAMO[next.zone]}</i></>
                : <><span>Último bloque</span><i>quedan {fmtClock(remaining)}</i></>}
            </div>

            <div className="tv-hrcheck">
              <div className="lab">Pulso que<br />marca la bici</div>
              <div className="v" aria-live="polite">
                {hr ?? '—'}
                {status && <small className={`tv-status-${status === 'en zona' ? 'en' : status}`}>{status === 'en zona' ? 'en zona ✓' : status === 'bajo' ? 'bajo: sube el ritmo' : 'sobre: afloja'}</small>}
                {!status && <small>opcional</small>}
              </div>
              <div className="tv-step">
                <button type="button" aria-label="Bajar pulso" onClick={() => setHr((v) => Math.max(40, (v ?? range[0]) - 1))}>−</button>
                <button type="button" className="p" aria-label="Subir pulso" onClick={() => setHr((v) => Math.min(230, (v ?? range[0]) + 1))}>+</button>
              </div>
            </div>
          </>
        )}

        <div className="ctrl">
          {g.finished ? (
            <>
              <button type="button" className="pri wide" onClick={finish}>Registrar etapa</button>
              <button type="button" className="wide" onClick={discard}>Descartar sesión</button>
            </>
          ) : confirming ? (
            <>
              <button type="button" className="warn" onClick={finish}>Terminar y registrar</button>
              <button type="button" onClick={() => setConfirming(false)}>Seguir</button>
              <button type="button" className="wide" onClick={discard}>Descartar sin registrar</button>
            </>
          ) : (
            <>
              {g.running
                ? <button type="button" className="pri" onClick={g.pause}>Pausa</button>
                : <button type="button" className="pri" onClick={g.resume}>Reanudar</button>}
              <button type="button" onClick={() => setConfirming(true)}>Terminar</button>
              <button type="button" className="wide" onClick={() => navigate('/quema')} style={{ borderStyle: 'dotted' }}>Volver (la sesión sigue)</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
