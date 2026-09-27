import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  GRASA, GRASA_ORDER, bpmRange, fmtClock, fmtDec, programMinutes, type GrasaId,
} from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { useGuided } from '../../guided.ts';
import { BlockProfile, Icon, WeightChart } from './svg.tsx';
import { Dial, Who } from './ui.tsx';

export default function Quema() {
  const { profile, d, updateProfile, saveWeight } = useReady();
  const guided = useGuided();
  const nav = useNavigate();
  const [sel, setSel] = useState<GrasaId>(profile.grasaLevel);
  const [kg, setKg] = useState(d.currentKg ?? 80);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const sug = d.grasaSuggestion;
  const prog = d.grasaProgress;
  const program = GRASA[sel];
  const todayW = d.weights.find((w) => w.date === d.today);
  const delta = d.currentKg != null && d.startKg != null ? d.currentKg - d.startKg : null;
  const lvlIdx = GRASA_ORDER.indexOf(profile.grasaLevel);

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); if (ok) setMsg({ ok: true, text: ok }); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };

  const start = () => { guided.start(sel); nav('/quema/sesion'); };

  return (
    <>
      <Who kicker="Programa guiado · control crucero" title="Quema de grasa" />

      {guided.active && guided.level && (
        <Link to="/quema/sesion" className="pod pad" style={{ borderColor: '#5a3f0e', display: 'block' }}>
          <div className="between"><span className="lab warn">En curso · bloque {guided.blockIndex + 1}/{guided.blocks.length}</span><span className="tt a">{Icon.play}Continuar</span></div>
          <div className="readout" style={{ fontSize: 30, marginTop: 6 }}>{GRASA[guided.level].title}</div>
          <div className="note">{fmtClock(guided.elapsedSec)} de {fmtClock(guided.totalSec)}{!guided.running && !guided.finished ? ' · en pausa' : ''}{guided.finished ? ' · completa, falta registrarla' : ''}</div>
        </Link>
      )}

      {sug && (
        <div className="pod pad" style={{ borderColor: '#5a3f0e' }}>
          <div className="lab warn">Indicador · {sug.direction === 'subir' ? 'listo para subir' : 'conviene bajar'} a {GRASA[sug.to as GrasaId].name}</div>
          {sug.reasons.map((r, i) => <div key={i} className="why"><i className={`l ${sug.direction === 'subir' ? 'on' : 'warn'}`} /><p>{r.text}</p><span /></div>)}
          <div className="acts" style={{ marginTop: 8 }}>
            <button type="button" className="ghost" disabled={busy} onClick={() => run(() => updateProfile({ dismiss: 'grasa' }))}>Ahora no</button>
            <button type="button" className="go" disabled={busy} onClick={() => run(async () => { await updateProfile({ grasaLevel: sug.to as GrasaId }); setSel(sug.to as GrasaId); })}>
              Pasar a {GRASA[sug.to as GrasaId].title}
            </button>
          </div>
        </div>
      )}

      <div className="pod pad">
        <div className="between">
          <span className="lab warn">Nivel {lvlIdx + 1} · {GRASA[profile.grasaLevel].name}</span>
          <span className="lab">{prog.completed} de {prog.needed} cumplidas</span>
        </div>
        <div className="lights" style={{ marginTop: 8 }} aria-label={`${prog.completed} de ${prog.needed} sesiones cumplidas`}>
          {Array.from({ length: prog.needed }, (_, i) => <i key={i} className={i < prog.completed ? 'on' : ''} />)}
        </div>
        <div style={{ marginTop: 12 }}>
          <BlockProfile blocks={program.blocks} width={340} height={46} axis label={`Perfil de ${program.title}`} />
        </div>
        <div className="between" style={{ marginTop: 8, alignItems: 'flex-start' }}>
          <div>
            <div className="readout" style={{ fontSize: 30 }}>{program.title}</div>
            <div className="note">{programMinutes(program)} min · {program.perWeek}/sem · {program.blocks.length} bloques</div>
          </div>
          {sel !== profile.grasaLevel && <span className="tt">Otro nivel</span>}
        </div>
        <p className="note" style={{ marginTop: 6 }}>{program.note}</p>
        <div className="zones" style={{ marginTop: 10, gridTemplateColumns: 'repeat(4,1fr)' }}>
          {([['Z1', [0.5, 0.6]], ['Z2', [0.6, 0.7]], ['Z3 alto', [0.75, 0.8]], ['Z4', [0.8, 0.9]]] as [string, [number, number]][]).map(([z, r]) => {
            const [a, b] = bpmRange(r, d.fcmax);
            const used = program.blocks.some((bl) => bl.range[0] === r[0]);
            return <span key={z} style={{ height: 'auto', padding: '5px 2px', display: 'block', textAlign: 'center', opacity: used ? 1 : 0.35, color: used ? 'var(--ink)' : undefined }}>{z}<br /><b style={{ fontFamily: 'var(--num)', fontSize: 13, letterSpacing: 0 }}>{a}–{b}</b></span>;
          })}
        </div>
        <button type="button" className="go" style={{ marginTop: 12 }} disabled={guided.active} onClick={start}>
          {guided.active ? 'Hay una sesión en curso' : `Iniciar ${program.title}`}
        </button>
      </div>

      <div className="lab" style={{ margin: '2px 0 -4px 2px' }}>Niveles · la forma de cada sesión (misma escala)</div>
      {GRASA_ORDER.map((id, i) => {
        const p = GRASA[id];
        return (
          <button type="button" key={id} className={`gear slim${id === profile.grasaLevel ? ' cur' : ''}${id === sel && id !== profile.grasaLevel ? ' sel' : ''}`}
            aria-pressed={id === sel} onClick={() => setSel(id)}>
            <div className="n">{i + 1}</div>
            <div><h4>{p.title}</h4><p>{programMinutes(p)} min · {p.perWeek}/sem{id === profile.grasaLevel && <span className="warn"> · {prog.completed} de {prog.needed} ✓</span>}</p></div>
            <BlockProfile blocks={p.blocks} width={112} height={30} scaleMin={45} />
          </button>
        );
      })}

      <div className="pod pad">
        <div className="between">
          <span className="lab">Peso semanal</span>
          {d.currentKg != null && (
            <span className="big" style={{ fontSize: 26 }}>{fmtDec(d.currentKg, 1)}<small>kg</small>
              {delta != null && delta !== 0 && <span className={delta < 0 ? 'up' : 'warn'} style={{ fontSize: 19, marginLeft: 6 }}>{delta > 0 ? '+' : '−'}{fmtDec(Math.abs(delta), 1)}</span>}
            </span>
          )}
        </div>
        {d.weights.length > 0 && <div style={{ marginTop: 6 }}><WeightChart points={d.weights} /></div>}
        <div className="note" style={{ marginTop: 4 }}>
          {d.bmi != null && <>IMC {fmtDec(d.bmi, 1)} · </>}{d.weights.length} {d.weights.length === 1 ? 'pesaje' : 'pesajes'}{d.startKg != null && d.weights.length > 1 && <> desde {fmtDec(d.startKg, 1)} kg</>}
        </div>
        <div style={{ marginTop: 10 }}>
          <Dial small label={todayW ? 'Pesaje de hoy (ya registrado)' : 'Pesaje de hoy'} value={kg} onChange={setKg} step={0.1} min={30} max={300} dec={1} unit="kg" />
        </div>
        <button type="button" className="go" style={{ marginTop: 10 }} disabled={busy}
          onClick={() => run(() => saveWeight({ date: d.today, kg }), 'Pesaje guardado')}>
          {todayW ? 'Actualizar pesaje de hoy' : 'Registrar pesaje'}
        </button>
        {msg && <p className={msg.ok ? 'ok-msg' : 'err'} role="status" style={{ marginTop: 8 }}>{msg.text}</p>}
        <p className="fine" style={{ marginTop: 8 }}>Bajar de peso depende sobre todo del déficit calórico: estas sesiones suman gasto, no prometen kilos.</p>
      </div>
    </>
  );
}
