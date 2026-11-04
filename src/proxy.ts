import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionToken, SESSION_COOKIE } from "@/lib/session";

// Sends anyone without a valid session to the sign-in page.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (isValidSessionToken(token, process.env.ADMIN_PASSWORD)) return NextResponse.next();

  const login = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/") login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the sign-in page, Next.js assets, icons and locally stored dev photos.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon.png|robots.txt|brand/|uploads/).*)"],
};
