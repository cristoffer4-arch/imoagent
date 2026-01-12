import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/ia-", "/perfil"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.get("imoagent-session")?.value;

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ia-:path*", "/perfil"],
};
