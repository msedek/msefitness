// Datos de ejemplo de SPEC.md (Tomás, plan Medio, 24 sesiones). Solo para tests.
import type { Profile, Session, Weight } from './domain.ts';

export const tomas: Profile = {
  email: 'tomas@example.com', name: 'Tomás', birthDate: '1977-06-10', sex: 'hombre', heightCm: 176,
  fcmaxOverride: null, plan: 'medio', planSince: '2026-08-01', grasaLevel: 'medio', grasaSince: '2026-09-01',
  theme: 'tablero', planDismissedAt: null, grasaDismissedAt: null,
};

export const sessions: Session[] = [
  { id: 1, date: '2026-08-17', minutes: 30, km: 9.5, hrAvg: 146, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 2, date: '2026-08-19', minutes: 31, km: 9.9, hrAvg: 149, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 3, date: '2026-08-21', minutes: 31, km: 9.9, hrAvg: 145, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 4, date: '2026-08-22', minutes: 34, km: 10.9, hrAvg: 145, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 5, date: '2026-08-24', minutes: 32, km: 10.4, hrAvg: 144, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 6, date: '2026-08-26', minutes: 33, km: 10.7, hrAvg: 147, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 7, date: '2026-08-28', minutes: 33, km: 10.8, hrAvg: 143, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 8, date: '2026-08-29', minutes: 34, km: 11.2, hrAvg: 143, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 9, date: '2026-08-31', minutes: 37, km: 12.2, hrAvg: 143, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 10, date: '2026-09-02', minutes: 29, km: 9.6, hrAvg: 145, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 11, date: '2026-09-04', minutes: 36, km: 12.0, hrAvg: 142, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 12, date: '2026-09-05', minutes: 36, km: 12.1, hrAvg: 141, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 13, date: '2026-09-07', minutes: 37, km: 12.5, hrAvg: 141, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 14, date: '2026-09-09', minutes: 39, km: 13.2, hrAvg: 143, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 15, date: '2026-09-11', minutes: 38, km: 13.0, hrAvg: 140, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 16, date: '2026-09-12', minutes: 38, km: 13.0, hrAvg: 139, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 17, date: '2026-09-14', minutes: 39, km: 13.4, hrAvg: 139, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 18, date: '2026-09-16', minutes: 40, km: 13.8, hrAvg: 142, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 19, date: '2026-09-18', minutes: 42, km: 14.6, hrAvg: 138, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 20, date: '2026-09-19', minutes: 41, km: 14.3, hrAvg: 138, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 21, date: '2026-09-21', minutes: 41, km: 14.4, hrAvg: 137, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 22, date: '2026-09-23', minutes: 42, km: 14.8, hrAvg: 140, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 23, date: '2026-09-25', minutes: 42, km: 14.9, hrAvg: 136, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
  { id: 24, date: '2026-09-26', minutes: 45, km: 16.0, hrAvg: 136, hrMax: null, rpe: null, note: null, kind: 'libre', grasaLevel: null },
];

export const weights: Weight[] = [
  { id: 1, date: '2026-08-17', kg: 91.4 }, { id: 2, date: '2026-08-24', kg: 91.0 }, { id: 3, date: '2026-08-31', kg: 90.5 },
  { id: 4, date: '2026-09-07', kg: 90.3 }, { id: 5, date: '2026-09-14', kg: 89.6 }, { id: 6, date: '2026-09-21', kg: 89.3 },
  { id: 7, date: '2026-09-27', kg: 89.0 },
];
