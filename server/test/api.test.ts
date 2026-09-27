import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { openDb } from '../db.ts';

const USUARIO1 = 'tomas@example.com';
const onboarding = { name: 'Tomás', birthDate: '1977-06-10', sex: 'hombre', heightCm: 176, plan: 'medio', grasaLevel: 'medio', theme: 'tablero', weightKg: 89 };
const session = { date: '2026-09-26', minutes: 45, km: 16, hrAvg: 136 };

let app: ReturnType<typeof createApp>;
const as = (email: string) => createApp(openDb(':memory:'), { allowed: [USUARIO1], devEmail: email });

beforeEach(() => { app = as(USUARIO1); });

describe('auth', () => {
  it('rechaza emails fuera de la lista', async () => {
    const res = await request(as('intruso@gmail.com')).get('/api/me');
    expect(res.status).toBe(403);
  });
  it('sin configuración de Access ni dev, 403', async () => {
    const res = await request(createApp(openDb(':memory:'), { allowed: [USUARIO1] })).get('/api/me');
    expect(res.status).toBe(403);
  });
  it('con Access configurado exige el JWT', async () => {
    const res = await request(createApp(openDb(':memory:'), { allowed: [USUARIO1], teamDomain: 'x.cloudflareaccess.com', audience: 'aud' })).get('/api/me');
    expect(res.status).toBe(401);
  });
  it('health no pide auth', async () => {
    expect((await request(as('nadie@x.cl')).get('/api/health')).status).toBe(200);
  });
});

describe('perfil', () => {
  it('sin perfil devuelve profile null y los datos piden onboarding', async () => {
    const me = await request(app).get('/api/me');
    expect(me.body.profile).toBeNull();
    expect((await request(app).get('/api/sessions')).status).toBe(409);
  });
  it('onboarding crea perfil y primer pesaje; no se repite', async () => {
    const res = await request(app).post('/api/me').send(onboarding);
    expect(res.status).toBe(201);
    expect(res.body.plan).toBe('medio');
    const w = await request(app).get('/api/weights');
    expect(w.body).toHaveLength(1);
    expect(w.body[0].kg).toBe(89);
    expect((await request(app).post('/api/me').send(onboarding)).status).toBe(409);
  });
  it('valida datos', async () => {
    const res = await request(app).post('/api/me').send({ ...onboarding, sex: 'x', heightCm: 20 });
    expect(res.status).toBe(400);
    expect(res.body.issues.length).toBe(2);
  });
  it('cambiar de plan reinicia plan_since y el descarte', async () => {
    await request(app).post('/api/me').send(onboarding);
    const d = await request(app).patch('/api/me').send({ dismiss: 'plan' });
    expect(d.body.planDismissedAt).toBeTruthy();
    const p = await request(app).patch('/api/me').send({ plan: 'avanzado', theme: 'travesia' });
    expect(p.body.plan).toBe('avanzado');
    expect(p.body.theme).toBe('travesia');
    expect(p.body.planDismissedAt).toBeNull();
  });
});

describe('sesiones y pesajes', () => {
  beforeEach(async () => { await request(app).post('/api/me').send(onboarding); });

  it('CRUD de sesión', async () => {
    const c = await request(app).post('/api/sessions').send({ ...session, note: 'buena' });
    expect(c.status).toBe(201);
    expect(c.body).toMatchObject({ minutes: 45, km: 16, hrAvg: 136, kind: 'libre', note: 'buena' });
    const u = await request(app).put(`/api/sessions/${c.body.id}`).send({ ...session, km: 16.4, kind: 'grasa', grasaLevel: 'medio' });
    expect(u.body).toMatchObject({ km: 16.4, kind: 'grasa', grasaLevel: 'medio' });
    expect((await request(app).get('/api/sessions')).body).toHaveLength(1);
    expect((await request(app).delete(`/api/sessions/${c.body.id}`)).status).toBe(204);
    expect((await request(app).get('/api/sessions')).body).toHaveLength(0);
  });
  it('rechaza sesión inválida', async () => {
    expect((await request(app).post('/api/sessions').send({ ...session, hrAvg: 20 })).status).toBe(400);
  });
  it('un pesaje por día (reemplaza)', async () => {
    await request(app).post('/api/weights').send({ date: '2026-09-27', kg: 94.8 });
    await request(app).post('/api/weights').send({ date: '2026-09-27', kg: 94.6 });
    const w = await request(app).get('/api/weights');
    expect(w.body.filter((x: { date: string }) => x.date === '2026-09-27')).toHaveLength(1);
  });
  it('no toca datos de otro usuario', async () => {
    const db = openDb(':memory:');
    const a = createApp(db, { allowed: [USUARIO1, 'usuario2@example.com'], devEmail: USUARIO1 });
    const b = createApp(db, { allowed: [USUARIO1, 'usuario2@example.com'], devEmail: 'usuario2@example.com' });
    await request(a).post('/api/me').send(onboarding);
    await request(b).post('/api/me').send({ ...onboarding, name: 'Ana', sex: 'mujer' });
    const s = await request(a).post('/api/sessions').send(session);
    expect((await request(b).delete(`/api/sessions/${s.body.id}`)).status).toBe(404);
    expect((await request(b).get('/api/sessions')).body).toHaveLength(0);
  });
});
