import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, sessionIsValid } from "@/server/auth/session";

/**
 * Passordsperre foran hele appen.
 *
 * Het `middleware.ts` før Next 16 — samme oppførsel, nytt filnavn. Kjører på
 * Node-runtime, så `node:crypto` i session-modulen er tilgjengelig her.
 *
 * Alt som ikke er innloggingssida krever en gyldig økt-cookie. Sider sendes
 * til /login, API-kall får 401 — en redirect til en HTML-side ville bare gitt
 * klienten en uforståelig JSON-parsefeil.
 */

const OPEN_PATHS = new Set(["/login", "/api/login"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (OPEN_PATHS.has(pathname)) return NextResponse.next();
  if (sessionIsValid(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Uten matcher kjører proxyen også på CSS, JS og bilder — da ville
  // innloggingssida stått uten stil.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
