// middleware.ts (letakkan di root proyek, sejajar dengan package.json)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Token hardcoded (sebaiknya nanti disimpan di environment variable)
const VALID_TOKEN = 'verylongpasswordtocheck';

export function middleware(request: NextRequest) {
  // Ambil cookie "userLogin"
  const userLoginCookie = request.cookies.get('userLogin')?.value;

  // Jika cookie tidak ada atau nilainya tidak sesuai token
  if (!userLoginCookie || userLoginCookie !== VALID_TOKEN) {
    // Redirect ke halaman login (asumsikan halaman login di "/")
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Jika valid, lanjutkan ke halaman /editor
  return NextResponse.next();
}

// Terapkan middleware hanya pada rute /editor dan turunannya
export const config = {
  matcher: '/editor/:path*',
};