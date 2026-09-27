import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';
import { openDb } from './db.ts';

const env = process.env;
const prod = env.NODE_ENV === 'production';
const dbFile = env.DB_FILE ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'msefitness.db');
mkdirSync(dirname(dbFile), { recursive: true });

if (prod && (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD)) throw new Error('faltan CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD');
if (prod && env.DEV_EMAIL) throw new Error('DEV_EMAIL no se permite en producción');

const allowed = (env.ALLOWED_EMAILS ?? env.DEV_EMAIL ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const app = createApp(openDb(dbFile), {
  allowed,
  teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
  audience: env.CF_ACCESS_AUD,
  devEmail: prod ? undefined : env.DEV_EMAIL,
}, env.STATIC_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'web', 'dist'));

const port = Number(env.PORT ?? 3990);
app.listen(port, () => console.log(`msefitness escuchando en :${port} (${prod ? 'producción' : 'desarrollo'}, ${allowed.length} usuarios)`));
