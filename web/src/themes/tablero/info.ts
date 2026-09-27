import type { ThemeId } from '../../../../shared/domain.ts';

export const THEME_NAMES: Record<ThemeId, string> = { tablero: 'Tablero', travesia: 'Travesía' };
export const SWATCH: Record<ThemeId, string[]> = {
  tablero: ['#0e0f11', '#ffae1f', '#ff3b24', '#3ddc8a'],
  travesia: ['#dfe6d8', '#6f9a5b', '#c8913f', '#3f7fae'],
};
export const THEME_NOTE: Record<ThemeId, string> = {
  tablero: 'Cuadro de instrumentos: tacómetro, odómetro y marchas.',
  travesia: 'Carta topográfica: cumbres, relieve y la Ruta 5.',
};
