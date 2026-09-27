import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { GRASA, bpmRange, fmtClock, fmtInt } from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { useGuided } from '../../guided.ts';
import { BlockProfile, Cruise, Icon } from './svg.tsx';
import { ConfirmButton, Dial, Full, Who } from './ui.tsx';

export default function Guiada() {
  const { d } = useReady();
  const g = useGuided();
  const nav = useNavigate();
  const [hr, setHr] = useState<number | null>(null);
  // Al terminar o descartar, el estado de la guiada se limpia antes de que llegue la navegación:
  // sin esta marca la redirección a /quema le ganaría a /registrar.
  const leaving = useRef(false);

  if (!g.active || !g.level || !g.block) return leaving.current ? null : <Navigate to="/quema" replace />;

  const program = GRASA[g.level];
  const band = bpmRange(g.block.range, d.fcmax);
  const status = hr != null ? g.checkHr(hr, d.fcmax) : null;
  const nextRange = g.next ? bpmRange(g.next.range, d.fcmax) : null;
  const leftMin = Math.max(0, Math.round((g.totalSec - g.elapsedSec) / 60));

  const finish = () => {
    leaving.current = true;
    const r = g.finish();
    if (r) nav('/registrar', { replace: true, state: { prefill: { minutes: r.minutes, kind: 'grasa', grasaLevel: r.level } } });
  };

  return (
    <Full>
      <Who
        kicker={`${program.name} · control crucero`}
        title={program.title}
        right={<button type="button" className="back" aria-label="Volver a Quema de grasa (la sesión sigue)" onClick={() => nav('/quema')}>{Icon.back}</button>}
      />

      {g.finished ? (
        <div className="pod done-banner">
          <div className="lab up">Sesión completa</div>
          <div className="readout" style={{ marginTop: 8 }}>{fmtClock(g.totalSec)}</div>
          <p className="note" style={{ marginTop: 8 }}>Anota la distancia que marca la bici y tu pulso promedio para cerrar la sesión.</p>
          <button type="button" className="save" style={{ marginTop: 14 }} onClick={finish}>Registrar sesión</button>
        </div>
      ) : (
        <div className="pod" style={{ padding: '12px 12px' }}>
          <div className="between">
            <span className="lab warn">Crucero · bloque {g.blockIndex + 1}/{g.blocks.length}</span>
            <span className={`tt ${g.running ? 'g' : 'a blink'}`}>{g.running ? <>{Icon.dot}En marcha</> : <>{Icon.dot}Pausa</>}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <Cruise fcmax={d.fcmax} band={band} hr={hr} status={status} />
            <div>
              <div className="lab">{g.block.label} · quedan</div>
              <div className="cd" aria-live="off">{fmtClock(g.blockRemainingSec)}</div>
              <div className="note" style={{ marginTop: 4 }}>Mantén <b style={{ color: 'var(--ink)' }}>{band[0]}–{band[1]} lpm</b></div>
            </div>
          </div>
          <div className="nextbox" style={{ marginTop: 10 }}>
            {g.next && nextRange
              ? <><span className="lab">Luego ▸ </span>{g.next.label} · {fmtClock(g.next.minutes * 60)} <span className="muted">· {nextRange[0]}–{nextRange[1]} lpm</span></>
              : <><span className="lab">Luego ▸ </span>Fin de la sesión</>}
          </div>
          <div style={{ marginTop: 12 }}>
            <BlockProfile blocks={g.blocks} width={340} height={46} current={g.blockIndex} cursorSec={g.elapsedSec} label="Avance de la sesión" />
          </div>
          <div className="between note" style={{ marginTop: 2, fontSize: 12 }}>
            <span>{fmtClock(g.elapsedSec)} de {fmtClock(g.totalSec)}</span><span>quedan {fmtInt(leftMin)} min</span>
          </div>
        </div>
      )}

      {!g.finished && <>
        {hr == null
          ? <button type="button" className="ghost" onClick={() => setHr(Math.round((band[0] + band[1]) / 2))}>{'¿Cuánto marca la bici? Revisa tu pulso'}</button>
          : <Dial small label="Pulso que marca la bici" hint={status ? <span className={status === 'en zona' ? 'up' : 'warn'}>{status}</span> : undefined} value={hr} onChange={setHr} step={1} min={40} max={230} unit="lpm" />}
        {status && status !== 'en zona' && <p className="note warn">{status === 'bajo' ? 'Sube un poco la cadencia o la resistencia.' : 'Afloja: baja la resistencia hasta volver al rango.'}</p>}

        <div className="acts">
          {g.running
            ? <button type="button" className="ghost" onClick={g.pause}>Pausa</button>
            : <button type="button" className="ghost" onClick={g.resume}>Reanudar</button>}
          <ConfirmButton className="go" label="Terminar" confirm={`¿Terminar? Llevas ${fmtInt(g.elapsedSec / 60)} min`} onConfirm={finish} />
        </div>
      </>}

      <ConfirmButton label="Descartar sesión" confirm="Toca otra vez: se pierde lo avanzado" onConfirm={() => { leaving.current = true; g.cancel(); nav('/quema', { replace: true }); }} />
      <p className="fine">La pantalla se mantiene encendida y el teléfono vibra al cambiar de bloque. Si sales de la app, el cronómetro sigue corriendo.</p>
    </Full>
  );
}
