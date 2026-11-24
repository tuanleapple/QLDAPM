// import { NextResponse, type NextRequest } from 'next/server';

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const token = request.cookies.get('access_token')?.value;

//   const isAuthRoute = pathname === '/login' || pathname === '/register';

//   const isProtectedRoute =
//     pathname.startsWith('/student') ||
//     pathname.startsWith('/officer') ||
//     pathname.startsWith('/admin') ||
//     pathname.startsWith('/supervisor') ||
//     pathname.startsWith('/enterprise') ||
//     pathname.startsWith('/change-password');

//   // If visiting protected route without token, redirect to /login
//   if (isProtectedRoute && !token) {
//     const loginUrl = new URL('/login', request.url);
//     return NextResponse.redirect(loginUrl);
//   }

//   // If already logged in and visiting /login, redirect to /
//   if (isAuthRoute && token) {
//     const homeUrl = new URL('/', request.url);
//     return NextResponse.redirect(homeUrl);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     '/login',
//     '/register',
//     '/student/:path*',
//     '/officer/:path*',
//     '/admin/:path*',
//     '/supervisor/:path*',
//     '/enterprise/:path*',
//     '/change-password',
//     '/change-password/:path*',
//   ],
// };

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('access_token')?.value;

  console.log('Middleware pathname:', pathname);
  console.log('Middleware token exists:', !!token);
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

  // 2. Nếu đang vào /login mà muốn force vào login để đổi tài khoản khác:
  // Cho phép mở /login nếu người dùng chủ động truy cập hoặc xóa đoạn auto-redirect này đi:
  // (Tạm thời bỏ hoặc comment đoạn if (isAuthRoute && token) để luôn luôn vào được /login khi cần)

  // if (isAuthRoute && token) {
  //   const homeUrl = new URL('/', request.url);
  //   return NextResponse.redirect(homeUrl);
  // }

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
