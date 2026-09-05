import { NextRequest, NextResponse } from 'next/server';

// Password-gates every /admin route (pages and API) with HTTP Basic Auth.
// Set ADMIN_PASSWORD in Vercel -> Settings -> Environment Variables.
// Username can be anything; only the password is checked.
export function middleware(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Fail closed: if no password is configured, block admin access entirely
  // rather than leaving it open.
  if (!adminPassword) {
    return new NextResponse('Admin access is not configured.', { status: 503 });
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const base64Credentials = authHeader.split(' ')[1] || '';
    // atob (not Buffer) -- middleware runs on the Edge Runtime, which doesn't
    // support Node's Buffer API. This was the actual bug blocking every login.
    const decoded = atob(base64Credentials);
    const [, password] = decoded.split(':');

    if (password === adminPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="HomeUpgraders Admin"',
    },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};
