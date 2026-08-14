import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { TOKEN_STORAGE_KEY } from "@/lib/api";

const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has(TOKEN_STORAGE_KEY);

  if (pathname === LOGIN_PATH) {
    if (hasToken) {
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (!hasToken) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
