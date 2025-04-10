import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Temporarily bypass all authentication checks
  return NextResponse.next();

  // Original authentication code (commented out)
  /*
  const authCookie = request.cookies.get('auth');
  const { pathname } = request.nextUrl;

  // Auth pages that should redirect to dashboard if user is authenticated
  const authPages = ['/auth/login', '/auth/signup', '/auth/reset-password'];
  
  // Protected pages that require authentication
  const protectedPages = ['/dashboard', '/expenses', '/recurring', '/settings'];

  // Check if the current path is an auth page
  const isAuthPage = authPages.some(page => pathname.startsWith(page));
  
  // Check if the current path is a protected page
  const isProtectedPage = protectedPages.some(page => pathname.startsWith(page));

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (isAuthPage && authCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to access protected pages, redirect to login
  if (isProtectedPage && !authCookie) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
  */
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/expenses/:path*',
    '/recurring/:path*',
    '/settings/:path*',
    '/auth/:path*',
  ],
}; 