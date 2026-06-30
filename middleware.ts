import { type NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/api/telegram-webhook") {
    return NextResponse.next();
  }

  return proxy(request);
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
