import { describe, expect, it } from 'vitest';
import {
  GRASA, derive, enrich, fcmaxOf, grasaCompleted, kcalKeytel, programMinutes, stepsEq, streakWeeks,
  suggestGrasa, suggestPlan, weekday, zoneOf, type SessionStats,
} from './domain.ts';
import { tomas, sessions, weights } from './fixtures.ts';

const TODAY = '2026-09-27';

describe('fisiología', () => {
  it('FCmáx por Tanaka: 49 años → 174, 42 años → 179', () => {
    expect(fcmaxOf(tomas, TODAY)).toBe(174);
    expect(fcmaxOf({ birthDate: '1984-01-15', fcmaxOverride: null }, TODAY)).toBe(179);
    expect(fcmaxOf({ ...tomas, fcmaxOverride: 181 }, TODAY)).toBe(181);
  });
  it('zonas por % FCmáx', () => {
    expect(zoneOf(136, 174)).toBe(3); // 78 %
    expect(zoneOf(146, 174)).toBe(4); // 84 %
    expect(zoneOf(104, 174)).toBe(1); // 59,8 %
  });
  it('pasos equivalentes: 45 min Z3 = 7.200; Z4 no da más crédito; 10.000 ≈ 62 min Z3', () => {
    expect(stepsEq(45, 136, 174)).toBe(7200);
    expect(stepsEq(30, 146, 174)).toBe(4800);
    expect(stepsEq(62.5, 130, 174)).toBe(10000);
  });
  it('calorías Keytel: sesión 26-sep ≈ 627 kcal', () => {
    expect(kcalKeytel('hombre', 136, 89, 49, 45)).toBeGreaterThan(620);
    expect(kcalKeytel('hombre', 136, 89, 49, 45)).toBeLessThan(635);
  });
});

describe('programas de quema de grasa', () => {
  it('duraciones 30 / 38 / 45 min', () => {
    expect(programMinutes(GRASA.iniciante)).toBe(30);
    expect(programMinutes(GRASA.medio)).toBe(38);
    expect(GRASA.medio.blocks).toHaveLength(9);
    expect(programMinutes(GRASA.avanzado)).toBe(45);
  });
});

describe('sugerencia de plan con los datos de SPEC', () => {
  const stats = sessions.map((s) => enrich(s, tomas, weights));
  it('sugiere subir a Avanzado con 7 de 10 sobre el 90 %', () => {
    const sug = suggestPlan(stats, 'medio');
    expect(sug?.direction).toBe('subir');
    expect(sug?.to).toBe('avanzado');
    expect(sug?.reasons[0].text).toContain('7 de tus últimas 10');
  });
  it('no sugiere nada con menos de 10 sesiones', () => {
    expect(suggestPlan(stats.slice(0, 9), 'medio')).toBeNull();
  });
  it('sugiere bajar si 3 de las últimas 5 quedan bajo el 60 %', () => {
    const weak = stats.map((s, i) => (i >= stats.length - 3 ? { ...s, pctTarget: 0.4 } : s));
    expect(suggestPlan(weak, 'medio')?.direction).toBe('bajar');
  });
  it('sugiere bajar con 3 sesiones seguidas sobre el 85 % FCmáx', () => {
    const hot = stats.map((s, i) => (i >= stats.length - 3 ? { ...s, alert: true } : s));
    expect(suggestPlan(hot, 'medio')?.to).toBe('principiante');
  });
  it('en Avanzado no sugiere subir', () => {
    expect(suggestPlan(stats, 'avanzado')).toBeNull();
  });
});

describe('quema de grasa: cumplida y nivel', () => {
  const g = (date: string, minutes: number, hrAvg: number): SessionStats =>
    enrich({ id: 0, date, minutes, km: 12, hrAvg, hrMax: null, rpe: null, note: null, kind: 'grasa', grasaLevel: 'medio' }, tomas, weights);
  it('cumplida = duración completa y pulso entre 60 % y 85 %', () => {
    expect(grasaCompleted(g('2026-09-10', 38, 125))).toBe(true);
    expect(grasaCompleted(g('2026-09-10', 30, 125))).toBe(false);
    expect(grasaCompleted(g('2026-09-10', 38, 150))).toBe(false); // 86 %
  });
  it('8 cumplidas → subir; 3 fallidas seguidas → bajar', () => {
    const ok = Array.from({ length: 8 }, (_, i) => g(`2026-09-${10 + i}`, 38, 125));
    expect(suggestGrasa(ok, 'medio', '2026-09-01')?.to).toBe('avanzado');
    const bad = Array.from({ length: 3 }, (_, i) => g(`2026-09-${10 + i}`, 20, 125));
    expect(suggestGrasa(bad, 'medio', '2026-09-01')?.to).toBe('iniciante');
    expect(suggestGrasa(ok, 'medio', '2026-09-20')).toBeNull(); // cuenta desde el cambio de nivel
  });
});

describe('derive', () => {
  const d = derive(tomas, sessions, weights, TODAY);
  it('semana 21–27 sep: 4 de 4; racha 6 semanas; 297,1 km', () => {
    expect(d.week.start).toBe('2026-09-21');
    expect(d.week.done).toBe(4);
    expect(d.streak).toBe(6);
    expect(d.totalKm).toBeCloseTo(297.1, 1);
  });
  it('última sesión 26-sep: 7.200 pasos, 103 %, Z3', () => {
    expect(d.last?.steps).toBe(7200);
    expect(Math.round((d.last?.pctTarget ?? 0) * 100)).toBe(103);
    expect(d.last?.zone).toBe(3);
  });
  it('peso 91,4 → 89,0 e IMC 28,7', () => {
    expect(d.startKg).toBe(91.4);
    expect(d.currentKg).toBe(89);
    expect(d.bmi?.toFixed(1)).toBe('28.7');
  });
  it('descartar oculta la sugerencia hasta una sesión nueva', () => {
    expect(derive({ ...tomas, planDismissedAt: '2026-09-26T20:00:00Z' }, sessions, weights, TODAY).planSuggestion).toBeNull();
    expect(derive({ ...tomas, planDismissedAt: '2026-09-25T20:00:00Z' }, sessions, weights, TODAY).planSuggestion).not.toBeNull();
  });
  it('sin datos no revienta (usuario nuevo)', () => {
    const e = derive(tomas, [], [], TODAY);
    expect(e.last).toBeNull();
    expect(e.streak).toBe(0);
    expect(e.bmi).toBeNull();
  });
  it('lunes = 0', () => {
    expect(weekday('2026-09-21')).toBe(0);
    expect(streakWeeks([], 'medio', TODAY)).toBe(0);
  });
});
