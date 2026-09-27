import type { ReactNode } from 'react';
import type { ThemeModule } from '../types.ts';
import './fonts.css';
import './travesia.css';
import Guiada from './Guiada.tsx';
import Hoy from './Hoy.tsx';
import Onboarding from './Onboarding.tsx';
import Perfil from './Perfil.tsx';
import Plan from './Plan.tsx';
import Progreso from './Progreso.tsx';
import Quema from './Quema.tsx';
import Registrar from './Registrar.tsx';
import { ErrorScreen, Loading, Shell } from './Shell.tsx';

// Tema Travesía: cada sesión es un mapa. Ver disenos/direccion-travesia.html.
const theme: ThemeModule = {
  Shell: ({ children }: { children: ReactNode }) => <Shell>{children}</Shell>,
  Loading,
  ErrorScreen,
  Onboarding,
  Hoy,
  Registrar,
  Progreso,
  Plan,
  Quema,
  Guiada,
  Perfil,
};
export default theme;
