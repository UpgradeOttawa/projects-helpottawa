import { NextRequest, NextResponse } from 'next/server';

// Password-gates every /admin route (pages and API) with HTTP Basic Auth.
// Set ADMIN_PASSWORD in Vercel -> Settings -> Environment Variables (Production checked).
// Username can be anything; only the password is checked.
//
// This is proxy.ts, not middleware.ts -- Next.js 16 renamed the convention.
// The old middleware.ts still built and ran (just deprecated), so it likely
// wasn't the actual cause of login failing, but this removes it as a variable
// and matches current Next.js 16 practice going forward.
export default function proxy(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Fail closed: if no password is configured, block admin access entirely
  // rather than leaving it open.
  if (!adminPassword) {
    return new NextResponse('Admin access is not configured.', { status: 503 });
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const base64Credentials = authHeader.split(' ')[1] || '';
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
  // Matches /admin itself AND every path under it (upload, api routes, etc.)
  matcher: ['/admin', '/admin/:path*'],
};
