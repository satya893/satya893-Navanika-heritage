import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from './src/lib/firebase-admin';

const protectedPaths = ['/admin', '/checkout', '/profile', '/order'];
const apiPaths = ['/api'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect API routes
  if (apiPaths.some(path => pathname.startsWith(path))) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const decoded = await verifyAuthToken(token);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.uid);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  // Protect page routes
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      const url = new URL('/?auth=required', request.url);
      return NextResponse.redirect(url);
    }
    try {
      await verifyAuthToken(token);
    } catch {
      const url = new URL('/?auth=expired', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/checkout/:path*', '/profile/:path*', '/order/:path*', '/api/:path*'],
};
