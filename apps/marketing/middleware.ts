import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { localeFromPathname, negotiateLocale } from "@/i18n/negotiate";

/**
 * Sends un-prefixed requests to a locale: the visitor's saved choice if they
 * made one with the language switcher, otherwise the best match for their
 * browser's Accept-Language header.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (localeFromPathname(pathname)) {
    // Server components cannot read the URL; not-found.tsx needs it to pick
    // its language.
    const headers = new Headers(request.headers);
    headers.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : negotiateLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  // The redirect target depends on these request headers; keep caches honest.
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export const config = {
  // Everything except Next internals, API-style metadata routes and files
  // with an extension (images, icons, fonts, robots.txt, sitemap.xml...).
  matcher: ["/((?!_next/|_vercel/|.*\\..*).*)"],
};
