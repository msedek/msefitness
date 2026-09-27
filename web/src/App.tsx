import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { DataProvider, useApp } from './data.tsx';
import { THEMES } from './themes/index.ts';

function Routed() {
  const app = useApp();
  const T = THEMES[app.theme];

  useEffect(() => { document.documentElement.dataset.theme = app.theme; }, [app.theme]);

  if (app.status === 'loading') return <T.Loading />;
  if (app.status === 'error') return <T.ErrorScreen message={app.error ?? 'Error'} onRetry={() => void app.reload()} />;
  if (app.status === 'onboarding') return <T.Onboarding />;

  return (
    <Routes>
      <Route path="/quema/sesion" element={<T.Guiada />} />
      <Route path="*" element={
        <T.Shell>
          <Routes>
            <Route path="/" element={<T.Hoy />} />
            <Route path="/registrar" element={<T.Registrar />} />
            <Route path="/progreso" element={<T.Progreso />} />
            <Route path="/plan" element={<T.Plan />} />
            <Route path="/quema" element={<T.Quema />} />
            <Route path="/perfil" element={<T.Perfil />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </T.Shell>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routed />
      </BrowserRouter>
    </DataProvider>
  );
}
