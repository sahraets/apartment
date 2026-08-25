import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  checkPassword,
  createSessionValue,
} from "@/server/auth/session";

/**
 * Kjører forespørselen over HTTPS?
 *
 * Avgjør om cookien skal merkes `secure`. Kan ikke utledes av NODE_ENV: et
 * produksjonsbygg kjørt på hjemmenettet går over vanlig http, og en
 * secure-cookie ville aldri blitt sendt tilbake — da kommer man aldri inn.
 * Bak en proxy (Vercel) er det `x-forwarded-proto` som vet hva brukeren ser.
 */
function isHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  return new URL(request.url).protocol === "https:";
}

/**
 * Controller: POST /api/login
 *
 * Tar imot skjemaet fra /login. Ved riktig passord settes økt-cookien og
 * brukeren sendes til forsida; ellers tilbake til /login med en feilmelding.
 * 303 fordi nettleseren skal gjøre en GET etter en POST.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const attempt = String(form.get("passord") ?? "");

  if (!checkPassword(attempt)) {
    return NextResponse.redirect(new URL("/login?feil=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(request),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
