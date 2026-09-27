# msefitness

PWA mobile-first para registrar y controlar el entrenamiento en bicicleta estacionaria: pasos equivalentes
(hasta 10.000 por sesión), zonas de pulso, planes Principiante / Medio / Avanzado con sugerencias de cambio de
nivel, sesiones guiadas de quema de grasa y seguimiento de peso. Tiene dos temas visuales: **Tablero** y **Travesía**.

**Autor y dueño:** [msedek](https://github.com/msedek). Ver [LICENSE](LICENSE).

- Stack: Node 24 + Express 5 + SQLite (better-sqlite3), React 19 + Vite 8 + vite-plugin-pwa.
- Acceso: Cloudflare Access; el servidor además verifica el JWT de Access.
- Reglas de cálculo y diseño: [`disenos/SPEC.md`](disenos/SPEC.md). Detalle técnico: [`AGENTS.md`](AGENTS.md).
- Los datos de ejemplo del repositorio son ficticios.

```bash
npm install
npm test
node scripts/seed-dev.ts data/dev.db && DB_FILE=data/dev.db npm run dev:server   # API :3991
npm run dev:web                                                                  # web :5190
```
