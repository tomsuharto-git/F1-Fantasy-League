import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  const isAuthPage = req.nextUrl.pathname.startsWith('/signin') ||
                     req.nextUrl.pathname.startsWith('/auth/callback');

  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                           req.nextUrl.pathname.startsWith('/create') ||
                           req.nextUrl.pathname.startsWith('/league') ||
                           req.nextUrl.pathname.startsWith('/draft') ||
                           req.nextUrl.pathname.startsWith('/race') ||
                           req.nextUrl.pathname.startsWith('/join');

  // Redirect to signin if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/signin';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if already logged in and trying to access signin
  if (isAuthPage && session && !req.nextUrl.pathname.includes('/callback')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
