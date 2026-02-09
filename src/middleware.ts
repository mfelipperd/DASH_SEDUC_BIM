import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only intercept S3 API routes
  if (request.nextUrl.pathname.startsWith('/api/s3/')) {
    const accessKey = request.headers.get('x-access-key');
    const adminKey = process.env.UPLOAD_ACCESS_KEY;
    const readOnlyKey = process.env.NEXT_PUBLIC_APP_READ_ONLY_KEY;

    // Special check for upload route: strictly requires admin key
    if (request.nextUrl.pathname.startsWith('/api/s3/upload')) {
      if (accessKey !== adminKey) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required' },
          { status: 401 }
        );
      }
    } else {
      // Other S3 routes (list, content): allow either admin or read-only key
      if (accessKey !== adminKey && accessKey !== readOnlyKey) {
        return NextResponse.json(
          { error: 'Unauthorized: Valid access key required' },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/s3/:path*',
};
