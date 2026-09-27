// Patrón del vault (Resources/cloudflare-access-reauth-pattern.md): si Cloudflare Access
// venció la cookie, los fetch reciben un redirect que no navega. Forzamos una navegación
// completa para que Access renueve la sesión con Google, con un tope para no ciclar.
const KEY = 'msefitness.reauth';
const MAX = 3;
const WINDOW_MS = 2 * 60 * 1000;
let fired = false;

export function triggerReauth(reason: string): boolean {
  if (fired) return true;
  let attempts: number[] = [];
  try { attempts = JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); } catch { /* sin storage */ }
  const now = Date.now();
  attempts = attempts.filter((t) => now - t < WINDOW_MS);
  if (attempts.length >= MAX) return false;
  attempts.push(now);
  try { sessionStorage.setItem(KEY, JSON.stringify(attempts)); } catch { /* sin storage */ }
  fired = true;
  console.warn('reauth:', reason);
  window.location.href = '/';
  return true;
}

export function clearReauthAttempts() {
  try { sessionStorage.removeItem(KEY); } catch { /* sin storage */ }
}
