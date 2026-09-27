import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface AuthConfig {
  allowed: string[];
  // Producción: verificar el JWT de Cloudflare Access.
  teamDomain?: string;
  audience?: string;
  // Desarrollo/tests: email fijo sin Access. Nunca se usa con NODE_ENV=production.
  devEmail?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { email: string } }
}

export function accessAuth(cfg: AuthConfig) {
  const allowed = new Set(cfg.allowed.map((e) => e.toLowerCase()));
  const jwks = cfg.teamDomain ? createRemoteJWKSet(new URL(`https://${cfg.teamDomain}/cdn-cgi/access/certs`)) : null;

  return async (req: Request, res: Response, next: NextFunction) => {
    let email: string | undefined;
    if (cfg.devEmail) {
      email = cfg.devEmail;
    } else if (jwks) {
      const token = req.header('cf-access-jwt-assertion');
      if (!token) return res.status(401).json({ error: 'sin token de acceso' });
      try {
        const { payload } = await jwtVerify(token, jwks, { issuer: `https://${cfg.teamDomain}`, audience: cfg.audience });
        email = typeof payload.email === 'string' ? payload.email : undefined;
      } catch {
        return res.status(401).json({ error: 'token de acceso inválido' });
      }
    }
    if (!email || !allowed.has(email.toLowerCase())) return res.status(403).json({ error: 'usuario no autorizado' });
    req.email = email.toLowerCase();
    next();
  };
}
