import type { ThemeId } from '../../../shared/domain.ts';
import tablero from './tablero/index.tsx';
import travesia from './travesia/index.tsx';
import type { ThemeModule } from './types.ts';

export const THEMES: Record<ThemeId, ThemeModule> = { tablero, travesia };
export const THEME_NAMES: Record<ThemeId, string> = { tablero: 'Tablero', travesia: 'Travesía' };
