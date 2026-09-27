# msefitness — Directivas de proyecto

PWA mobile-first para registrar y controlar el entrenamiento en bicicleta estacionaria de dos usuarios.
El brief completo y las reglas de cálculo están en `disenos/SPEC.md`, y la ficha del proyecto en el vault
(`Projects/msefitness.md`).

## Stack

```
Servidor: Node 24 (TypeScript con type stripping, sin build) + Express 5 + better-sqlite3 + zod + jose
Web:      React 19 + React Router + Vite 8 + vite-plugin-pwa
BD:       SQLite en ./data/msefitness.db (migraciones por PRAGMA user_version en server/db.ts)
Infra:    1 container Docker en msenas, 127.0.0.1:3990 → tunnel msenas → msefitness.msecloud.cl
Auth:     Cloudflare Access (Google), y el server verifica el JWT Cf-Access-Jwt-Assertion y la lista ALLOWED_EMAILS
```

## Estructura

- `shared/domain.ts`: **toda** la lógica de negocio (FCmáx, zonas, pasos equivalentes, Keytel, eficiencia,
  sugerencias de nivel, semana, racha, récords y peso). La usan la web y los tests. Cualquier regla nueva va aquí, con test.
- `server/`: API REST `/api/*` (me, sessions, weights), auth y SQLite. En producción también sirve `web/dist`.
- `web/src/`: núcleo (`data.tsx` con los datos y acciones, `guided.ts` con la sesión guiada, `api.ts`, `reauth.ts`)
  y los temas `themes/tablero`, `themes/travesia`. Los temas **solo presentan** y cumplen `themes/types.ts`.
- `disenos/`: láminas de diseño originales (referencia visual de los temas).

## Comandos

```bash
npm test                      # vitest: dominio + API
npx tsc -p tsconfig.json      # typecheck
node scripts/seed-dev.ts data/dev.db   # datos de ejemplo (solo dev)
DB_FILE=data/dev.db npm run dev:server  # API en :3991 con DEV_EMAIL
npm run dev:web               # Vite en :5190 con proxy /api
```

## Deploy (msenas)

```bash
rsync -a --delete --exclude node_modules --exclude data --exclude .env --exclude web/dist ./ msenas:~/projects/msefitness/
ssh msenas 'cd ~/projects/msefitness && docker compose up -d --build'
```

- `.env` vive solo en msenas (ver `.env.example`): `ALLOWED_EMAILS`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`.
- Cloudflare: la app de Access `msefitness.msecloud.cl` usa solo Google, `auto_redirect_to_identity` y 730 h,
  con apps bypass para `manifest.webmanifest`, `sw.js`, `registerSW.js`, `workbox-*` e `icons/`.
  El tunnel es remote-managed: se edita por API (GET→append→PUT), nunca `/etc/cloudflared/config.yml`.
- `/api/health` responde sin auth (Uptime Kuma por la red docker).

## Reglas

- Fechas `YYYY-MM-DD` en hora de Chile (`todayCL`). Números en formato chileno (`fmt*`).
- Cada usuario ve solo sus datos, y en la cabecera aparece solo el usuario logueado.
- Las calorías se rotulan siempre como "estimado". La app sugiere cambios de nivel, pero no los aplica sola.
- Bug fix = test que lo reproduce + fix.
- Commits: `tipo(alcance): descripción`.
