"use client";

import styles from "./ThemeToggle.module.css";

/**
 * Bryter mellom lys og mørk modus.
 *
 * Komponenten holder ingen state. Fasit på hvilket tema som gjelder er
 * `data-theme` på <html>, satt av skriptet i layouten før siden tegnes — og
 * ikonet byttes med CSS ut fra samme attributt. Dermed slipper vi både
 * hydreringsavvik og at knappen mangler på første opptegning.
 */
export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";

    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Privat vindu e.l. — temaet gjelder ut økta, men huskes ikke.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.toggle}
      aria-label="Bytt mellom mørk og lys modus"
    >
      {/* Begge ikonene ligger i knappen; CSS viser det som passer temaet. */}
      <span className={`${styles.icon} ${styles.moon}`} aria-hidden="true">
        🌙
      </span>
      <span className={`${styles.icon} ${styles.sun}`} aria-hidden="true">
        ☀️
      </span>
    </button>
  );
}
