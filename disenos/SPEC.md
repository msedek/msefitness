# msefitness — brief común para las 6 láminas de diseño

App web **mobile-first** para registrar y controlar entrenamiento en **bicicleta estacionaria**.
Dos usuarios: **Tomás** y **Ana** (login por Cloudflare Access, sin pantalla de login propia).
Idioma de la UI: español latino neutro, tuteo. Números con formato chileno (miles con punto: 7.200; decimales con coma: 14,8 km).

## Datos que se registran por sesión
- Obligatorios: **tiempo** (min), **distancia** (km, la que marca la bici), **pulsaciones promedio** (lpm).
- Opcionales: pulsaciones máximas, esfuerzo percibido (1–10), nota corta. Fecha = hoy por defecto.
- El ingreso debe ser rapidísimo con el pulgar: steppers/teclado numérico grande, no formularios largos.

## Métrica central: "pasos equivalentes"
- FCmáx estimada = 208 − 0,7 × edad (Tanaka). Tomás: 49 años → **174 lpm**. Ana: la app lo calcula con su fecha de nacimiento.
- Zona por % de FCmáx: Z1 <60 %, Z2 60–70 %, Z3 70–80 %, Z4 80–90 %, Z5 ≥90 %.
- Pasos equivalentes = minutos × factor: Z1 → 100/min, Z2 → 130/min, Z3–Z5 → 160/min
  (Z4–Z5 no dan más crédito: pedalear sobre el 85 % sostenido se marca como alerta, no como premio).
- **10.000 pasos = tope del nivel máximo** ≈ 62 min en Z3.

## Planes (3 niveles)
| Plan | Meta por sesión | Sesiones/semana | Duración guía | Zona objetivo |
|---|---|---|---|---|
| Principiante | 4.000 pasos eq | 3 | 25–35 min | Z2 (60–70 %) |
| Medio | 7.000 pasos eq | 4 | 40–50 min | Z3 (70–80 %) |
| Avanzado | 10.000 pasos eq (tope) | 5 | 55–65 min | Z3 con tramos Z4 |

## Sugerencia de cambio de nivel (análisis de la data)
- **Subir**: ≥90 % de la meta en 7 de las últimas 10 sesiones **y** pulso promedio estable o bajando **y** eficiencia subiendo.
- **Bajar**: <60 % de la meta en 3 de las últimas 5 sesiones, **o** pulso promedio ≥85 % FCmáx en 3 sesiones seguidas.
- La app **sugiere**, el usuario acepta o descarta. Mostrar el porqué con los datos (no una caja negra).

## Métricas y visualizaciones extra (incluir las que calcen con tu dirección)
- **Eficiencia cardíaca**: metros por latido = distancia_m / (FC × min). Si sube = mejor estado aeróbico ("más kilómetros con el mismo corazón"). Es la métrica de progreso más honesta.
- Anillo/medidor de la sesión vs meta; progreso semanal (sesiones hechas / plan).
- Tendencia de pasos eq por sesión con la línea de meta; tendencia de pulso promedio; distancia acumulada.
- Calendario/heatmap de constancia y racha de semanas cumplidas.
- Distribución de tiempo en zonas; récords personales (sesión más larga, más km, mejor eficiencia).
- Vista comparada Tomás / Ana (opcional, amistosa, cada uno con su plan).

## Datos de ejemplo — Tomás, plan **Medio**, 24 sesiones (lun/mié/vie/sáb). Hoy es dom 27-sep-2026.
| fecha | día | min | km | FC prom | %FCmax | zona | pasos eq | % meta 7.000 | km/h | m por latido |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-08-17 | lun | 30 | 9.5 | 146 | 84 | Z4 | 4800 | 69 | 19.0 | 2.17 |
| 2026-08-19 | mié | 31 | 9.9 | 149 | 86 | Z4 | 4960 | 71 | 19.2 | 2.14 |
| 2026-08-21 | vie | 31 | 9.9 | 145 | 83 | Z4 | 4960 | 71 | 19.2 | 2.2 |
| 2026-08-22 | sáb | 34 | 10.9 | 145 | 83 | Z4 | 5440 | 78 | 19.2 | 2.21 |
| 2026-08-24 | lun | 32 | 10.4 | 144 | 83 | Z4 | 5120 | 73 | 19.5 | 2.26 |
| 2026-08-26 | mié | 33 | 10.7 | 147 | 84 | Z4 | 5280 | 75 | 19.5 | 2.21 |
| 2026-08-28 | vie | 33 | 10.8 | 143 | 82 | Z4 | 5280 | 75 | 19.6 | 2.29 |
| 2026-08-29 | sáb | 34 | 11.2 | 143 | 82 | Z4 | 5440 | 78 | 19.8 | 2.3 |
| 2026-08-31 | lun | 37 | 12.2 | 143 | 82 | Z4 | 5920 | 85 | 19.8 | 2.31 |
| 2026-09-02 | mié | 29 | 9.6 | 145 | 83 | Z4 | 4640 | 66 | 19.9 | 2.28 |
| 2026-09-04 | vie | 36 | 12.0 | 142 | 82 | Z4 | 5760 | 82 | 20.0 | 2.35 |
| 2026-09-05 | sáb | 36 | 12.1 | 141 | 81 | Z4 | 5760 | 82 | 20.2 | 2.38 |
| 2026-09-07 | lun | 37 | 12.5 | 141 | 81 | Z4 | 5920 | 85 | 20.3 | 2.4 |
| 2026-09-09 | mié | 39 | 13.2 | 143 | 82 | Z4 | 6240 | 89 | 20.3 | 2.37 |
| 2026-09-11 | vie | 38 | 13.0 | 140 | 80 | Z4 | 6080 | 87 | 20.5 | 2.44 |
| 2026-09-12 | sáb | 38 | 13.0 | 139 | 80 | Z3 | 6080 | 87 | 20.5 | 2.46 |
| 2026-09-14 | lun | 39 | 13.4 | 139 | 80 | Z3 | 6240 | 89 | 20.6 | 2.47 |
| 2026-09-16 | mié | 40 | 13.8 | 142 | 82 | Z4 | 6400 | 91 | 20.7 | 2.43 |
| 2026-09-18 | vie | 42 | 14.6 | 138 | 79 | Z3 | 6720 | 96 | 20.9 | 2.52 |
| 2026-09-19 | sáb | 41 | 14.3 | 138 | 79 | Z3 | 6560 | 94 | 20.9 | 2.53 |
| 2026-09-21 | lun | 41 | 14.4 | 137 | 79 | Z3 | 6560 | 94 | 21.1 | 2.56 |
| 2026-09-23 | mié | 42 | 14.8 | 140 | 80 | Z4 | 6720 | 96 | 21.1 | 2.52 |
| 2026-09-25 | vie | 42 | 14.9 | 136 | 78 | Z3 | 6720 | 96 | 21.3 | 2.61 |
| 2026-09-26 | sáb | 45 | 16.0 | 136 | 78 | Z3 | 7200 | 103 | 21.3 | 2.61 |

Distancia acumulada: 297.1 km en 24 sesiones

Lectura de estos datos: 7 de las últimas 10 sesiones ≥90 % de la meta, pulso bajó de ~146 a 136 lpm,
eficiencia subió de 2,17 a 2,61 m/latido (+20 %) → **la app sugiere subir a Avanzado**.
Semana actual (21–27 sep): 4 de 4 sesiones cumplidas; racha: 6 semanas seguidas cumpliendo el plan.
Récords: sesión más larga 45 min / 16,0 km (26-sep); mejor eficiencia 2,61 m/latido.

Ana (para vistas comparadas): Plan **Principiante**, 3 ses/sem, últimas sesiones ~28–32 min,
8–10 km, 118–124 lpm (Z2), ~3.600–4.200 pasos eq, racha 3 semanas.

## Pantallas que debe mostrar cada lámina (marcos de teléfono ~390×844 lado a lado)
1. **Inicio / Hoy** — estado de la semana, última sesión, meta de pasos eq, acceso inmediato a "Registrar".
2. **Registrar sesión** — tiempo, distancia, pulso (+ opcionales plegados), preview en vivo de pasos eq y zona.
3. **Progreso** — gráficos (pasos eq vs meta, pulso, eficiencia, distancia acumulada, calendario de constancia).
4. **Plan y nivel** — los 3 planes, el actual destacado, y la tarjeta de sugerencia "listo para Avanzado" con el porqué.

## Plataforma (decisión del usuario, 2026-09-27)
- El front será una **PWA** (instalable en la pantalla de inicio, manifest + service worker). Las láminas deben
  pensarse como app a pantalla completa: sin barra de navegador, zona segura superior/inferior respetada.

## Sección "Quema de grasa" (pedido del usuario, 2026-09-27)
Programa aparte de sesiones **guiadas** de 30–45 min para bajar de peso, con 3 niveles propios
(Iniciante, Medio, Avanzado). Cada sesión es una secuencia de bloques con zona de pulso objetivo;
la app la reproduce en **modo guiado** (bloque actual, tiempo restante del bloque, rango de lpm a mantener,
lo que viene después) y al terminar pre-llena el registro (tiempo, pulso promedio; el usuario pone la distancia).
Esas sesiones también suman pasos equivalentes y cuentan para el plan general.

Base: el trabajo continuo en Z2 (60–70 %) es donde la grasa aporta la mayor proporción de energía; los
intervalos elevan el gasto total. Bajar de peso depende sobre todo del déficit calórico: la app lo dice
en una línea, sin prometer kilos.

| Nivel | Duración | Veces/sem | Estructura |
|---|---|---|---|
| Iniciante — "Base quemadora" | 30 min | 3 | 5' calentamiento Z1 · 20' continuo Z2 · 5' vuelta a la calma Z1 |
| Medio — "Oleadas" | 38 min | 4 | 5' calentamiento · 3 × (5' Z2 + 3' Z3 alto) · 4' Z2 · 5' vuelta a la calma (= 38', 9 bloques) |
| Avanzado — "Intervalos + fondo" | 45 min | 4 (nunca 2 días de intervalos seguidos) | 8' calentamiento · 6 × (2' Z4 + 2' Z2 suave) · 8' Z2 constante · 5' vuelta a la calma |

Rangos en lpm (se calculan por persona):
- Tomás (FCmáx 174): Z1 <104 · Z2 104–122 · Z3 122–139 · Z4 139–157.

Cambio de nivel en quema de grasa: subir cuando completas 8 sesiones del nivel con ≥80 % del tiempo dentro
de la zona indicada y sin alertas de pulso; bajar si en 3 sesiones seguidas no logras mantener la zona o
aparecen alertas.

**Peso (nuevo registro opcional)**: peso semanal (kg) para ver la tendencia de la baja (línea con media móvil,
kg perdidos desde el inicio). Calorías por sesión = **estimación** por pulso, edad, peso y sexo (fórmula de
Keytel 2005), siempre rotulada como estimación.
Peso actual de ejemplo: **Tomás 89 kg** (el de Ana lo ingresa ella en la app). Tendencia de ejemplo (Tomás, historia ficticia que
termina en su peso actual): 17-ago 91,4 · 24-ago 91,0 · 31-ago 90,5 · 07-sep 90,3 · 14-sep 89,6 · 21-sep 89,3 ·
27-sep 89,0 kg → −2,4 kg en 6 semanas.
Calorías de ejemplo (Keytel, hombre, 49 años, 89 kg): sesión 26-sep 45 min a 136 lpm ≈ 627 kcal;
sesión "Oleadas" 38 min a ~125 lpm promedio ≈ 466 kcal. Rotular siempre "estimado". Tomás está en nivel Medio "Oleadas",
5 de 8 sesiones completadas; sesión de ejemplo en curso: bloque 3 de 9 (Z3 alto), 1:48 restante, pulso 134 lpm.

### Pantalla 5 que debe agregar cada lámina
5. **Quema de grasa** — los 3 niveles de sesión con su perfil de bloques dibujado (la forma de la sesión se ve de
   un vistazo), la sesión en **modo guiado** en curso, y la tendencia de peso.

## Perfil del usuario — lo recoge la app (pedido del usuario, 2026-09-27)
Nada de edad, peso, estatura ni sexo va fijo en el código: la app los pide en un **onboarding de primera vez**
(tras el login de Cloudflare Access, identificado por el email) y se editan en **Perfil**:
- fecha de nacimiento (→ edad → FCmáx Tanaka; permitir sobrescribir FCmáx si la conoce por test),
- sexo (solo para la fórmula de calorías de Keytel, que tiene versión hombre/mujer),
- estatura (cm) → IMC junto a la tendencia de peso,
- peso actual (kg) — alimenta el registro de peso semanal,
- plan inicial (Principiante/Medio/Avanzado) y nivel inicial de Quema de grasa.
Valores de ejemplo, ficticios (para verificar cálculos, no para hardcodear): Tomás 49 años, 1,76 m, 89 kg
(IMC 28,7). Los datos de Ana los ingresa ella en el onboarding.
El onboarding usa el lenguaje visual de la dirección ganadora; no hace falta pantalla en las láminas.

## Decisiones de implementación (2026-09-27, tras elegir las direcciones 1 y 3)
- Temas **Tablero** (dirección 1) y **Travesía** (dirección 3), **seleccionables** por el usuario (onboarding y Perfil; se guarda en su perfil).
- Arriba a la derecha va **solo el usuario logueado** (nombre/inicial). Sin selector Tomás/Ana ni vistas de otro usuario:
  cada uno ve únicamente sus datos.
- Sin pulsómetro conectado la app no mide el tiempo en zona. El modo guiado muestra el rango de lpm del bloque y permite
  (opcional) ingresar el pulso que marca la bici para ver "bajo / en zona / sobre". Una sesión guiada se da por
  **cumplida** si duró lo programado y el pulso promedio quedó entre 60 % y 85 % FCmáx.
  Subir de nivel de quema: 8 cumplidas en el nivel. Bajar: 3 seguidas no cumplidas.
- Descartar una sugerencia la oculta hasta la próxima sesión registrada. Aceptar cambia el plan y reinicia la ventana de análisis.
- Toda la lógica vive en `shared/domain.ts` (con tests). Los temas solo presentan.
