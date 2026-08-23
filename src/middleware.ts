import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_PATH = '/nxd-92f';
const LOGIN_PATH = `${ADMIN_PATH}/login`;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept admin routes
  if (!pathname.startsWith(ADMIN_PATH)) {
    return NextResponse.next();
  }

  // Create a response to pass along
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session & verify user
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in and visiting /login -> redirect straight to admin dashboard
  if (pathname === LOGIN_PATH) {
    if (user) {
      return NextResponse.redirect(new URL(ADMIN_PATH, request.url));
    }
    return response;
  }

  // If NOT logged in and visiting any admin route -> redirect to admin login
  if (!user) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    if (pathname !== ADMIN_PATH) {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/nxd-92f/:path*'],
};
