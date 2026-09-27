// Travesía virtual por la Ruta 5 Sur desde Santiago. Distancias por carretera APROXIMADAS
// (se rotulan "aprox." en la UI). Al llegar a Quellón, fin de la Ruta 5, empieza otra vuelta.
export const HITOS: [string, number][] = [
  ['Santiago', 0],
  ['Rancagua', 87],
  ['San Fernando', 140],
  ['Curicó', 195],
  ['Talca', 255],
  ['Linares', 305],
  ['Chillán', 400],
  ['Los Ángeles', 510],
  ['Temuco', 675],
  ['Osorno', 925],
  ['Puerto Montt', 1030],
  ['Ancud', 1115],
  ['Castro', 1200],
  ['Quellón', 1300],
];
export const RUTA_KM = HITOS[HITOS.length - 1][1];

export interface Posicion {
  vuelta: number;
  km: number; // km dentro de la vuelta actual
  prev: [string, number];
  next: [string, number] | null;
  prevIdx: number;
}

export function posicion(totalKm: number): Posicion {
  const vuelta = Math.floor(totalKm / RUTA_KM) + 1;
  const km = totalKm - (vuelta - 1) * RUTA_KM;
  let prevIdx = 0;
  HITOS.forEach(([, k], i) => { if (k <= km) prevIdx = i; });
  return { vuelta, km, prev: HITOS[prevIdx], next: HITOS[prevIdx + 1] ?? null, prevIdx };
}

// Ventana de hitos alrededor de la posición: 2 atrás, hasta 3 adelante, al menos 6 en total.
export function ventana(p: Posicion, atras = 3, adelante = 3): [string, number][] {
  let a = Math.max(0, p.prevIdx - atras);
  let z = Math.min(HITOS.length - 1, p.prevIdx + adelante);
  while (z - a < atras + adelante && (a > 0 || z < HITOS.length - 1)) {
    if (a > 0) a--; else z++;
  }
  return HITOS.slice(a, z + 1);
}
