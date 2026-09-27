import { useState, type ReactNode } from 'react';
import { PLANS, PLAN_ORDER, fmtInt, type PlanId, type Suggestion } from '../../../../shared/domain.ts';
import { useReady } from '../../data.tsx';
import { MiniSpark, TerrainSection, Triangles } from './charts.tsx';
import { ALTURA } from './palette.ts';
import { Sec, TitleBlock } from './ui.tsx';

export default function Plan() {
  const { profile, d, updateProfile } = useReady();
  const sug = d.planSuggestion;
  const inPlan = d.stats.filter((s) => s.date >= profile.planSince);
  const last10 = inPlan.slice(-10);

  return (
    <>
      <TitleBlock k="Corte del terreno" title="Tres alturas" r="estás en" rb={d.plan.name} />

      <TerrainSection plan={profile.plan} suggestion={sug} />

      {sug ? (
        <SuggestionCard sug={sug} evidence={sug.direction === 'subir' ? [
          <Triangles key="t" flags={last10.map((s) => s.pctTarget >= 0.9)} />,
          <MiniSpark key="h" values={inPlan.slice(-10).map((s) => s.hrAvg)} />,
          <MiniSpark key="e" values={inPlan.slice(-10).map((s) => s.efficiency)} />,
        ] : []}
          title={sug.direction === 'subir' ? `Paso abierto: estás listo para ${PLANS[sug.to as PlanId].name}` : `Conviene volver a ${PLANS[sug.to as PlanId].name}`}
          accept={`${sug.direction === 'subir' ? 'Subir' : 'Bajar'} a ${PLANS[sug.to as PlanId].name}`}
          keep={`Seguir en ${d.plan.name}`}
          footer={`La app sugiere; tú decides. Nueva meta: ${fmtInt(PLANS[sug.to as PlanId].target)} pasos eq, ${PLANS[sug.to as PlanId].perWeek} sesiones por semana.`}
          onAccept={() => updateProfile({ plan: sug.to as PlanId })}
          onDismiss={() => updateProfile({ dismiss: 'plan' })} />
      ) : (
        <div className="tv-empty" style={{ textAlign: 'left' }}>
          {profile.plan === 'avanzado'
            ? <>Estás en la <b>Cordillera</b>: 10.000 pasos eq es el tope del programa. La app te avisará si conviene bajar un tramo.</>
            : inPlan.length < 10
              ? <>Para evaluar un cambio se necesitan 10 etapas en este plan: llevas <b>{inPlan.length}</b>. Luego la app mira si superas el 90 % de la meta en 7 de 10, con pulso estable y eficiencia al alza.</>
              : <>Llevas <b>{last10.filter((s) => s.pctTarget >= 0.9).length} de 10</b> etapas recientes sobre el 90 % de la meta. Con 7, pulso estable y eficiencia al alza, se abre el paso.</>}
        </div>
      )}

      <section aria-labelledby="tv-pl-planes">
        <Sec id="tv-pl-planes" title="Los tres planes" aside="la altura de cada meta" />
        <div className="tv-plans">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const cur = id === profile.plan;
            return (
              <div key={id} className={`tv-plan${cur ? ' cur' : ''}`} aria-current={cur || undefined}>
                <div className="sw" style={{ background: ALTURA[id].color }} />
                <div>
                  <b>{p.name} · {ALTURA[id].name}</b>
                  <span>{p.perWeek} ses/sem · {p.minutes[0]}–{p.minutes[1]} min · {p.zoneLabel}{cur ? ' — tu plan' : ''}</span>
                </div>
                <div className="m">{fmtInt(p.target)}<small>{id === 'avanzado' ? 'tope' : 'pasos eq'}</small></div>
              </div>
            );
          })}
        </div>
        <p className="tv-note s" style={{ marginTop: 6 }}>10.000 pasos eq equivalen a los 10.000 pasos diarios recomendados, pedaleados: ≈ 62 min en Z3.</p>
      </section>
    </>
  );
}

export function SuggestionCard({ sug, title, accept, keep, footer, evidence, onAccept, onDismiss }: {
  sug: Suggestion; title: string; accept: string; keep: string; footer: string; evidence: ReactNode[];
  onAccept: () => Promise<void>; onDismiss: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<void>) => async () => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const down = sug.direction === 'bajar';
  return (
    <section className={`tv-sug${down ? ' down' : ''}`} aria-label="Sugerencia de cambio de nivel">
      <div className="k">Sugerencia · análisis de tus datos</div>
      <h3>{title}</h3>
      {sug.reasons.map((r, i) => (
        <div className="tv-ev" key={r.text}>
          <p>{r.text}</p>
          {evidence[i] ?? <span className={r.ok ? 'ok' : 'no'} aria-label={r.ok ? 'se cumple' : 'no se cumple'}>{r.ok ? '▲' : '—'}</span>}
        </div>
      ))}
      <div className="tv-acts">
        <button type="button" className="a1" disabled={busy} onClick={run(onAccept)}>{accept}</button>
        <button type="button" className="a2" disabled={busy} onClick={run(onDismiss)}>{keep}</button>
      </div>
      {error && <p className="tv-error" role="alert">{error}</p>}
      <p className="tv-note s">{footer}</p>
    </section>
  );
}
