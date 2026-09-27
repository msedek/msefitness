import express, { type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { todayCL, type Profile, type Session, type Weight } from '../shared/domain.ts';
import { accessAuth, type AuthConfig } from './auth.ts';
import type { DB } from './db.ts';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha YYYY-MM-DD');
const plan = z.enum(['principiante', 'medio', 'avanzado']);
const grasa = z.enum(['iniciante', 'medio', 'avanzado']);

const profileIn = z.object({
  name: z.string().trim().min(1).max(40),
  birthDate: date,
  sex: z.enum(['hombre', 'mujer']),
  heightCm: z.number().min(100).max(230),
  fcmaxOverride: z.number().int().min(120).max(230).nullable().optional(),
  plan,
  grasaLevel: grasa,
  theme: z.enum(['tablero', 'travesia']),
  // Solo en el onboarding: primer pesaje.
  weightKg: z.number().min(30).max(300).optional(),
});
const profilePatch = profileIn.omit({ weightKg: true }).partial().extend({
  dismiss: z.enum(['plan', 'grasa']).optional(),
});

const sessionIn = z.object({
  date,
  minutes: z.number().min(1).max(300),
  km: z.number().min(0).max(200),
  hrAvg: z.number().int().min(40).max(230),
  hrMax: z.number().int().min(40).max(240).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  note: z.string().trim().max(280).nullable().optional(),
  kind: z.enum(['libre', 'grasa']).default('libre'),
  grasaLevel: grasa.nullable().optional(),
});

const weightIn = z.object({ date, kg: z.number().min(30).max(300) });

type Row = Record<string, unknown>;

const toProfile = (r: Row): Profile => ({
  email: r.email as string,
  name: r.name as string,
  birthDate: r.birth_date as string,
  sex: r.sex as Profile['sex'],
  heightCm: r.height_cm as number,
  fcmaxOverride: (r.fcmax_override as number | null) ?? null,
  plan: r.plan as Profile['plan'],
  planSince: r.plan_since as string,
  grasaLevel: r.grasa_level as Profile['grasaLevel'],
  grasaSince: r.grasa_since as string,
  theme: r.theme as Profile['theme'],
  planDismissedAt: (r.plan_dismissed_at as string | null) ?? null,
  grasaDismissedAt: (r.grasa_dismissed_at as string | null) ?? null,
});

const toSession = (r: Row): Session => ({
  id: r.id as number,
  date: r.date as string,
  minutes: r.minutes as number,
  km: r.km as number,
  hrAvg: r.hr_avg as number,
  hrMax: (r.hr_max as number | null) ?? null,
  rpe: (r.rpe as number | null) ?? null,
  note: (r.note as string | null) ?? null,
  kind: r.kind as Session['kind'],
  grasaLevel: (r.grasa_level as Session['grasaLevel']) ?? null,
});

const toWeight = (r: Row): Weight => ({ id: r.id as number, date: r.date as string, kg: r.kg as number });

function bad(res: Response, err: z.ZodError) {
  return res.status(400).json({ error: 'datos inválidos', issues: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
}

export function createApp(db: DB, auth: AuthConfig, staticDir?: string) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // Sin auth: la usa Uptime Kuma desde la red docker.
  app.get('/api/health', (_req, res) => { res.json({ ok: true }); });

  const api = express.Router();
  api.use(accessAuth(auth));

  const userId = (req: Request) =>
    (db.prepare('SELECT id FROM users WHERE email = ?').get(req.email) as { id: number } | undefined)?.id;

  const requireUser = (req: Request, res: Response) => {
    const id = userId(req);
    if (!id) res.status(409).json({ error: 'perfil pendiente' });
    return id;
  };

  api.get('/me', (req, res) => {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(req.email) as Row | undefined;
    res.json({ email: req.email, profile: row ? toProfile(row) : null, today: todayCL() });
  });

  // Onboarding: crea el perfil (y el primer pesaje).
  api.post('/me', (req, res) => {
    const p = profileIn.safeParse(req.body);
    if (!p.success) return bad(res, p.error);
    if (userId(req)) return res.status(409).json({ error: 'el perfil ya existe' });
    const today = todayCL();
    const v = p.data;
    db.transaction(() => {
      const { lastInsertRowid } = db.prepare(`INSERT INTO users
        (email, name, birth_date, sex, height_cm, fcmax_override, plan, plan_since, grasa_level, grasa_since, theme)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
        req.email, v.name, v.birthDate, v.sex, v.heightCm, v.fcmaxOverride ?? null, v.plan, today, v.grasaLevel, today, v.theme);
      if (v.weightKg) db.prepare('INSERT INTO weights (user_id, date, kg) VALUES (?,?,?)').run(lastInsertRowid, today, v.weightKg);
    })();
    res.status(201).json(toProfile(db.prepare('SELECT * FROM users WHERE email = ?').get(req.email) as Row));
  });

  api.patch('/me', (req, res) => {
    const id = requireUser(req, res);
    if (!id) return;
    const p = profilePatch.safeParse(req.body);
    if (!p.success) return bad(res, p.error);
    const v = p.data;
    const current = toProfile(db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Row);
    const today = todayCL();
    const cols: Record<string, unknown> = {};
    if (v.name !== undefined) cols.name = v.name;
    if (v.birthDate !== undefined) cols.birth_date = v.birthDate;
    if (v.sex !== undefined) cols.sex = v.sex;
    if (v.heightCm !== undefined) cols.height_cm = v.heightCm;
    if (v.fcmaxOverride !== undefined) cols.fcmax_override = v.fcmaxOverride;
    if (v.theme !== undefined) cols.theme = v.theme;
    // Cambiar de nivel reinicia la ventana de análisis y limpia el descarte.
    if (v.plan !== undefined && v.plan !== current.plan) Object.assign(cols, { plan: v.plan, plan_since: today, plan_dismissed_at: null });
    if (v.grasaLevel !== undefined && v.grasaLevel !== current.grasaLevel) Object.assign(cols, { grasa_level: v.grasaLevel, grasa_since: today, grasa_dismissed_at: null });
    if (v.dismiss) cols[`${v.dismiss}_dismissed_at`] = new Date().toISOString();
    const keys = Object.keys(cols);
    if (keys.length) db.prepare(`UPDATE users SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => cols[k]), id);
    res.json(toProfile(db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Row));
  });

  api.get('/sessions', (req, res) => {
    const id = requireUser(req, res);
    if (!id) return;
    res.json((db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY date, id').all(id) as Row[]).map(toSession));
  });

  const writeSession = (req: Request, res: Response, sessionId?: number) => {
    const id = requireUser(req, res);
    if (!id) return;
    const p = sessionIn.safeParse(req.body);
    if (!p.success) return bad(res, p.error);
    const v = p.data;
    const vals = [v.date, v.minutes, v.km, v.hrAvg, v.hrMax ?? null, v.rpe ?? null, v.note || null, v.kind, v.kind === 'grasa' ? v.grasaLevel ?? null : null];
    let sid = sessionId;
    if (sid === undefined) {
      sid = Number(db.prepare(`INSERT INTO sessions (date, minutes, km, hr_avg, hr_max, rpe, note, kind, grasa_level, user_id)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(...vals, id).lastInsertRowid);
    } else {
      const r = db.prepare(`UPDATE sessions SET date=?, minutes=?, km=?, hr_avg=?, hr_max=?, rpe=?, note=?, kind=?, grasa_level=?
        WHERE id = ? AND user_id = ?`).run(...vals, sid, id);
      if (!r.changes) return res.status(404).json({ error: 'sesión no encontrada' });
    }
    res.status(sessionId === undefined ? 201 : 200).json(toSession(db.prepare('SELECT * FROM sessions WHERE id = ?').get(sid) as Row));
  };

  api.post('/sessions', (req, res) => writeSession(req, res));
  api.put('/sessions/:id', (req, res) => writeSession(req, res, Number(req.params.id)));
  api.delete('/sessions/:id', (req, res) => {
    const id = requireUser(req, res);
    if (!id) return;
    const r = db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').run(Number(req.params.id), id);
    res.status(r.changes ? 204 : 404).end();
  });

  api.get('/weights', (req, res) => {
    const id = requireUser(req, res);
    if (!id) return;
    res.json((db.prepare('SELECT * FROM weights WHERE user_id = ? ORDER BY date').all(id) as Row[]).map(toWeight));
  });

  // Un pesaje por día: registrar de nuevo el mismo día lo reemplaza.
  api.post('/weights', (req, res) => {
    const id = requireUser(req, res);
    if (!id) return;
    const p = weightIn.safeParse(req.body);
    if (!p.success) return bad(res, p.error);
    db.prepare(`INSERT INTO weights (user_id, date, kg) VALUES (?,?,?)
      ON CONFLICT(user_id, date) DO UPDATE SET kg = excluded.kg`).run(id, p.data.date, p.data.kg);
    res.status(201).json(toWeight(db.prepare('SELECT * FROM weights WHERE user_id = ? AND date = ?').get(id, p.data.date) as Row));
  });

  api.delete('/weights/:id', (req, res) => {
    const id = requireUser(req, res);
    if (!id) return;
    const r = db.prepare('DELETE FROM weights WHERE id = ? AND user_id = ?').run(Number(req.params.id), id);
    res.status(r.changes ? 204 : 404).end();
  });

  app.use('/api', api);
  app.use('/api', (_req, res) => { res.status(404).json({ error: 'no existe' }); });

  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir, {
      setHeaders: (res, path) => {
        // El service worker y el HTML nunca se cachean; los assets con hash, un año.
        if (/(sw\.js|index\.html|manifest\.webmanifest)$/.test(path)) res.setHeader('Cache-Control', 'no-cache');
        else if (path.includes('/assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }));
    app.get('/{*path}', (_req, res) => { res.setHeader('Cache-Control', 'no-cache'); res.sendFile(join(staticDir, 'index.html')); });
  }
  return app;
}
