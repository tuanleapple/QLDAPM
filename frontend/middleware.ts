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
    pathname.startsWith('/supervisor') ||
    pathname.startsWith('/enterprise') ||
    pathname.startsWith('/change-password');

  // 1. Chưa có token mà cố vào route bảo vệ -> Bắt buộc về /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Đã có token mà cố quay lại trang đăng nhập -> Về trang chủ '/' (trang chủ sẽ tự redirect theo Role)
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
    '/enterprise/:path*',
    '/change-password',
    '/change-password/:path*',
  ],
};
