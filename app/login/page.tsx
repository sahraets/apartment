import { passwordIsConfigured } from "@/server/auth/session";
import styles from "./page.module.css";

/**
 * Innloggingssida. Vanlig HTML-skjema som poster til /api/login, så den virker
 * uten JavaScript og trenger ingen client-komponent.
 */
export default async function LoginPage(props: PageProps<"/login">) {
  const { feil } = await props.searchParams;
  const konfigurert = passwordIsConfigured();

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Leiligheten vår</h1>
      <p className={styles.lead}>Skriv inn passordet for å komme inn.</p>

      {konfigurert ? (
        <form className={styles.form} method="post" action="/api/login">
          <label className={styles.label} htmlFor="passord">
            Passord
          </label>
          <input
            className={styles.input}
            id="passord"
            name="passord"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
          />
          {feil && <p className={styles.error}>Feil passord. Prøv igjen.</p>}
          <button className={styles.button} type="submit">
            Logg inn
          </button>
        </form>
      ) : (
        <p className={styles.error}>
          <code>APP_PASSWORD</code> er ikke satt, så ingen kommer inn. Legg den i{" "}
          <code>.env.local</code> lokalt, og som miljøvariabel der appen er
          deployet.
        </p>
      )}
    </main>
  );
}
