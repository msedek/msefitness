import type { ThemeModule } from '../types.ts';
import Guiada from './Guiada.tsx';
import Hoy from './Hoy.tsx';
import Onboarding from './Onboarding.tsx';
import Perfil from './Perfil.tsx';
import Plan from './Plan.tsx';
import Progreso from './Progreso.tsx';
import Quema from './Quema.tsx';
import Registrar from './Registrar.tsx';
import { ErrorScreen, Loading, Shell } from './ui.tsx';

// Tema Tablero: cuadro de instrumentos de gran turismo (lámina disenos/direccion-tablero.html).
const theme: ThemeModule = { Shell, Loading, ErrorScreen, Onboarding, Hoy, Registrar, Progreso, Plan, Quema, Guiada, Perfil };
export default theme;
