// frontend/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isProtectedRoute =
    pathname.startsWith('/student') ||
    pathname.startsWith('/officer') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/supervisor');

  // If visiting protected route without token, redirect to /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and visiting /login, redirect to /
  if (isAuthRoute && token) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/student/:path*',
    '/officer/:path*',
    '/admin/:path*',
    '/supervisor/:path*',
  ],
};
