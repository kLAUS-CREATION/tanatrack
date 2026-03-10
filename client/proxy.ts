import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'am'];
const defaultLocale = 'en';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read Better-Auth session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token') || request.cookies.get('__Secure-better-auth.session_token');
  const isAuthenticated = !!sessionCookie;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');
  const lang = segments[1];

  let nextUrl = request.nextUrl;

  // Handle Locale Redirection If Missing
  if (!lang) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  if (!locales.includes(lang)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Handle Route Protection
  const isDashboardRoute = pathname.includes('/dashboard');
  const isOrgRoute = pathname.includes('/organizations');
  const isAuthRoute = pathname.includes('/auth');

  if ((isDashboardRoute || isOrgRoute) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/auth/sign-in`;
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/organizations`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
