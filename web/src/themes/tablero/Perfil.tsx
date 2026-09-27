import { useState } from 'react';
import {
  GRASA, GRASA_ORDER, PLANS, PLAN_ORDER, ageOn, fcmaxTanaka, fmtInt, programMinutes, type Sex, type ThemeId,
} from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { SWATCH, THEME_NAMES, THEME_NOTE } from './info.ts';
import { Dial, Who } from './ui.tsx';

export default function Perfil() {
  const { profile, email, d, updateProfile, setTheme } = useReady();
  const [f, setF] = useState({
    name: profile.name, birthDate: profile.birthDate, sex: profile.sex, heightCm: profile.heightCm,
    fcmaxOverride: profile.fcmaxOverride,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const tanaka = fcmaxTanaka(ageOn(f.birthDate, d.today));
  const dirty = f.name !== profile.name || f.birthDate !== profile.birthDate || f.sex !== profile.sex || f.heightCm !== profile.heightCm || f.fcmaxOverride !== profile.fcmaxOverride;

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ ok: true, text: ok }); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };

  return (
    <>
      <Who kicker={email} title="Perfil" right={null} />

      <div className="pod pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="lab">Datos personales</div>
        <label className="field"><span className="lab">Nombre</span>
          <input className="text" value={f.name} maxLength={40} autoComplete="given-name" onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <label className="field"><span className="lab">Fecha de nacimiento · {ageOn(f.birthDate, d.today)} años</span>
          <input className="text" type="date" value={f.birthDate} max={d.today} onChange={(e) => e.target.value && setF({ ...f, birthDate: e.target.value })} />
        </label>
        <div className="field"><span className="lab">Sexo · solo para la fórmula de calorías</span>
          <div className="seg" role="group" aria-label="Sexo">
            {(['hombre', 'mujer'] as Sex[]).map((s) => <button type="button" key={s} className={f.sex === s ? 'on' : ''} aria-pressed={f.sex === s} onClick={() => setF({ ...f, sex: s })}>{s}</button>)}
          </div>
        </div>
        <Dial small label="Estatura" value={f.heightCm} onChange={(v) => setF({ ...f, heightCm: v })} step={1} min={100} max={230} unit="cm" />
        <div className="field">
          <span className="lab">FCmáx · calculada {tanaka} lpm (208 − 0,7 × edad)</span>
          <div className="seg" role="group" aria-label="Origen de la FCmáx">
            <button type="button" className={f.fcmaxOverride == null ? 'on' : ''} onClick={() => setF({ ...f, fcmaxOverride: null })}>Calculada</button>
            <button type="button" className={f.fcmaxOverride != null ? 'on' : ''} onClick={() => setF({ ...f, fcmaxOverride: f.fcmaxOverride ?? tanaka })}>La conozco</button>
          </div>
          {f.fcmaxOverride != null && <Dial small label="Tu FCmáx medida" value={f.fcmaxOverride} onChange={(v) => setF({ ...f, fcmaxOverride: v })} step={1} min={120} max={230} unit="lpm" />}
        </div>
        <button type="button" className="go" disabled={!dirty || busy || !f.name.trim()} onClick={() => run(() => updateProfile({ ...f, name: f.name.trim() }), 'Datos guardados')}>Guardar datos</button>
        {msg && <p className={msg.ok ? 'ok-msg' : 'err'} role="status">{msg.text}</p>}
      </div>

      <div className="pod pad" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="lab">Tema de la app</div>
        {(['tablero', 'travesia'] as ThemeId[]).map((t) => (
          <button type="button" key={t} className={`choice${profile.theme === t ? ' on' : ''}`} aria-pressed={profile.theme === t} disabled={busy}
            onClick={() => profile.theme !== t && run(() => setTheme(t), `Tema ${THEME_NAMES[t]}`)}>
            <div><h4>{THEME_NAMES[t]}</h4><p>{THEME_NOTE[t]}</p></div>
            <div className="theme-sw">{SWATCH[t].map((c) => <i key={c} style={{ background: c }} />)}</div>
          </button>
        ))}
      </div>

      <div className="pod pad" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="lab">Plan de pasos · cambio manual</div>
        {PLAN_ORDER.map((id, i) => (
          <button type="button" key={id} className={`gear${profile.plan === id ? ' cur' : ''}`} disabled={busy} aria-pressed={profile.plan === id}
            onClick={() => profile.plan !== id && run(() => updateProfile({ plan: id }), `Plan ${PLANS[id].name}`)}>
            <div className="n">{i + 1}</div>
            <div><h4>{PLANS[id].name}</h4><p>{PLANS[id].perWeek} ses/sem · {PLANS[id].zoneLabel}</p></div>
            <div className="m">{fmtInt(PLANS[id].target)}<small>pasos eq</small></div>
          </button>
        ))}
        <div className="lab" style={{ marginTop: 6 }}>Quema de grasa · nivel</div>
        {GRASA_ORDER.map((id, i) => (
          <button type="button" key={id} className={`gear${profile.grasaLevel === id ? ' cur' : ''}`} disabled={busy} aria-pressed={profile.grasaLevel === id}
            onClick={() => profile.grasaLevel !== id && run(() => updateProfile({ grasaLevel: id }), `Quema de grasa: ${GRASA[id].title}`)}>
            <div className="n">{i + 1}</div>
            <div><h4>{GRASA[id].title}</h4><p>{GRASA[id].name} · {programMinutes(GRASA[id])} min · {GRASA[id].perWeek}/sem</p></div>
            <span />
          </button>
        ))}
        <p className="fine">Cambiar de nivel reinicia la ventana con la que la app evalúa tus sugerencias.</p>
      </div>
    </>
  );
}
