import { defineMiddleware } from 'astro:middleware';
import { createHmac, timingSafeEqual } from 'node:crypto';

// fallback token: used when API_KEY is not set in .env (dev only, insecure)
const SESSION_SECRET = import.meta.env.API_KEY ?? 'dev-secret-change-me';

function verifySession(cookie: string): string | null {
  const parts = cookie.split(':');
  if (parts.length !== 3) return null;
  const [username, ts, sig] = parts;
  const payload = `${username}:${ts}`;
  const expected = Buffer.from(
    createHmac('sha256', SESSION_SECRET).update(payload).digest('hex'),
    'utf8',
  );
  const actual = Buffer.from(sig, 'utf8');
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;
  if (Date.now() - parseInt(ts, 10) > 24 * 60 * 60 * 1000) return null;
  return username;
}

export const onRequest = defineMiddleware((context, next) => {
  if (context.url.pathname === '/login' || context.url.pathname.startsWith('/api/')) {
    return next();
  }

  if (context.url.pathname === '/logout') {
    context.cookies.delete('nl_session', { path: '/' });
    return context.redirect('/login');
  }

  const cookie = context.cookies.get('nl_session')?.value;
  if (!cookie || !verifySession(cookie)) {
    return context.redirect('/login');
  }

  return next();
});
