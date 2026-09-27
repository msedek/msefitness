// Carga los datos de ejemplo de SPEC en una base de DESARROLLO (nunca producción).
// Uso: node scripts/seed-dev.ts data/dev.db
import { tomas, sessions, weights } from '../shared/fixtures.ts';
import { openDb } from '../server/db.ts';

const file = process.argv[2];
if (!file || file.includes('msefitness.db')) throw new Error('indica una base de desarrollo, ej: data/dev.db');
const db = openDb(file);
db.exec('DELETE FROM weights; DELETE FROM sessions; DELETE FROM users;');
const uid = db.prepare(`INSERT INTO users (email, name, birth_date, sex, height_cm, plan, plan_since, grasa_level, grasa_since, theme)
  VALUES (?,?,?,?,?,?,?,?,?,?)`).run(tomas.email, tomas.name, tomas.birthDate, tomas.sex, tomas.heightCm, tomas.plan,
  tomas.planSince, tomas.grasaLevel, tomas.grasaSince, tomas.theme).lastInsertRowid;
const ins = db.prepare('INSERT INTO sessions (user_id, date, minutes, km, hr_avg, kind, grasa_level) VALUES (?,?,?,?,?,?,?)');
for (const s of sessions) ins.run(uid, s.date, s.minutes, s.km, s.hrAvg, s.kind, s.grasaLevel);
// 5 sesiones guiadas "Oleadas" (SPEC: 5 de 8 completadas).
for (const [date, hr] of [['2026-09-03', 124], ['2026-09-10', 126], ['2026-09-15', 123], ['2026-09-20', 125], ['2026-09-24', 124]] as const)
  ins.run(uid, date, 38, 12.9, hr, 'grasa', 'medio');
for (const w of weights) db.prepare('INSERT INTO weights (user_id, date, kg) VALUES (?,?,?)').run(uid, w.date, w.kg);
console.log(`dev db lista: ${file}`);
