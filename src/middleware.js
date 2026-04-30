import { NextResponse } from 'next/server';

export function middleware(request) {
  const start = Date.now();
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  if (
    pathname === '/' ||
    pathname === '/health' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/library')
  ) {
    console.log('HTTP request', {
      method: request.method,
      pathname,
      host: request.headers.get('host'),
      userAgent: request.headers.get('user-agent'),
      durationMs: Date.now() - start,
    });
  }

  return response;
}

export const config = {
  matcher: ['/', '/health', '/login/:path*', '/library/:path*'],
};
