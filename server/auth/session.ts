import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ett delt passord for hele leiligheten — ingen brukere, ingen database.
 *
 * Etter riktig passord får nettleseren en signert cookie. Cookien inneholder
 * bare utløpstidspunktet og en HMAC av det, signert med selve passordet. Da
 * kan ingen forfalske en økt uten å kjenne passordet, og bytter vi passord,
 * blir alle gamle økter ugyldige av seg selv.
 */

export const SESSION_COOKIE = "leilighet_okt";

/** Hvor lenge man slipper å logge inn på nytt. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function configuredPassword(): string | null {
  const value = process.env.APP_PASSWORD;
  return value ? value : null;
}

/** False når APP_PASSWORD mangler — da er hele appen stengt, ikke åpen. */
export function passwordIsConfigured(): boolean {
  return configuredPassword() !== null;
}

function hmac(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

/** Sammenligner uten å røpe hvor mange tegn som var riktige. */
function equals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function checkPassword(attempt: string): boolean {
  const secret = configuredPassword();
  if (!secret) return false;

  // Begge sider hashes først, så sammenligningen alltid går over like mange
  // bytes — ellers ville lengden på det riktige passordet kunne leses ut av
  // hvor lang tid sjekken tar.
  return equals(hmac("passordsjekk", attempt), hmac("passordsjekk", secret));
}

/** Verdien som legges i cookien etter riktig passord. */
export function createSessionValue(): string {
  const secret = configuredPassword();
  if (!secret) throw new Error("APP_PASSWORD mangler");

  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${hmac(secret, String(expiresAt))}`;
}

/** Er cookien vår egen, og fortsatt gyldig? */
export function sessionIsValid(cookieValue: string | undefined): boolean {
  const secret = configuredPassword();
  if (!secret || !cookieValue) return false;

  const separator = cookieValue.indexOf(".");
  if (separator === -1) return false;

  const expiresAt = Number(cookieValue.slice(0, separator));
  const signature = cookieValue.slice(separator + 1);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  return equals(signature, hmac(secret, String(expiresAt)));
}
