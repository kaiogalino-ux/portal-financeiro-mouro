import { NextResponse } from 'next/server';
import { auth } from '@/server/auth/auth';

// Roda em runtime Node.js (não Edge) para poder usar a mesma auth() com
// Prisma/bcrypt sem duplicar configuração. É só o gate grosseiro de sessão —
// a autorização real acontece no servidor, em withAuthz (ver src/server/data-access).
export const runtime = 'nodejs';

const PUBLIC_PATHS = ['/login', '/esqueci-senha', '/redefinir-senha'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!req.auth?.user?.active && !isPublic) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth?.user?.active && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
