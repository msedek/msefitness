import type { PlanId, Zone } from '../../../../shared/domain.ts';

// Colores de la carta topográfica. Espejo de las variables CSS de travesia.css, para los SVG.
export const C = {
  paper: '#edf1e8',
  paper2: '#e2e8da',
  paper3: '#d5dccb',
  ink: '#3a2c1f',
  ink2: '#6b5641',
  ink3: '#9a8670',
  contour: '#a8733a',
  contour2: '#cfae84',
  forest: '#6f9a5b',
  forest2: '#a9c492',
  water: '#3b7aa3',
  water2: '#b7d3e1',
  route: '#b8382a',
} as const;

// Tintes hipsométricos = zonas cardíacas.
export const ZC: Record<Zone, string> = { 1: '#bcd5a3', 2: '#dfe2a6', 3: '#e6c586', 4: '#d19558', 5: '#a95f42' };

// Tintes de altura para rellenar bandas de 1.000 pasos (de valle a cumbre).
export const TINTS = ['#d9e6c9', '#c9dcb2', '#dfe2a6', '#e9d9a0', '#e6c586', '#dcad73', '#cf9a62', '#c48a55', '#b97b4b', '#ad6c43'];
export const tint = (i: number) => TINTS[Math.max(0, Math.min(TINTS.length - 1, i))];

// Cada plan es una altura del terreno.
export const ALTURA: Record<PlanId, { name: string; color: string }> = {
  principiante: { name: 'Valle', color: ZC[1] },
  medio: { name: 'Precordillera', color: ZC[3] },
  avanzado: { name: 'Cordillera', color: ZC[5] },
};

export const COND = "'Barlow Condensed', 'Arial Narrow', sans-serif";
export const SERIF = "'Spectral', Georgia, serif";
