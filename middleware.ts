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
    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
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
