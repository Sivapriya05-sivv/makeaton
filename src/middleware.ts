import { NextResponse, NextRequest } from 'next/server';

const PUBLIC = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];
const JWT_SECRET = process.env.JWT_SECRET || 'brightloop-secret-key-makeathon';

async function verifyTokenEdge(token: string): Promise<{ id: number; role: string; email: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sig = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sig,
      enc.encode(`${headerB64}.${payloadB64}`)
    );

    if (!valid) return null;

    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    );

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    if (
      typeof payload.id === 'number' &&
      typeof payload.role === 'string' &&
      typeof payload.email === 'string'
    ) {
      return {
        id: payload.id,
        role: payload.role,
        email: payload.email,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  if (pathname.startsWith('/api/auth')) return NextResponse.next();
  if (PUBLIC.includes(pathname)) return NextResponse.next();

  const user = token ? await verifyTokenEdge(token) : null;

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Ensure that if a logged-in customer tries to access any route NOT starting with /portal or /api, they are redirected to /portal/subscriptions
  if (user.role === 'customer' && !pathname.startsWith('/portal') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/portal/subscriptions', req.url));
  }

  // Redirect non-customers away from portal to dashboard
  if (pathname.startsWith('/portal') && user.role !== 'customer') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
