import type { ThemeModule } from '../types.ts';

// Marcador provisorio: lo reemplaza la implementación del tema.
const P = () => <p style={{ padding: 24 }}>Tema tablero en construcción</p>;
const theme: ThemeModule = {
  Shell: ({ children }) => <>{children}</>, Loading: P, ErrorScreen: ({ message }) => <p>{message}</p>,
  Onboarding: P, Hoy: P, Registrar: P, Progreso: P, Plan: P, Quema: P, Guiada: P, Perfil: P,
};
export default theme;
