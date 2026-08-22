import type { Game } from "phaser";

/**
 * Phaser lytter på tastetrykk på hele vinduet, og kaller `preventDefault()`
 * på tastene spillet har fanget (WASD og piltastene). Skriver du «sofa» i et
 * tekstfelt, blir altså «s» og «a» spist av spillet — og figuren går i tillegg
 * sin vei mens du skriver.
 *
 * Løsningen er å skru av Phaser sitt tastatur når fokus står i et skrivefelt,
 * og på igjen ellers. Da slipper vi å gi avkall på capture, som er det som
 * hindrer at piltastene scroller siden mens du spiller.
 *
 * Fasiten hentes fra `document.activeElement` idet en tast trykkes, ikke fra
 * fokus-hendelsene alene: fjernes et felt mens det har fokus — som når skjemaet
 * lukkes etter at du har lagt til en ting — sender nettleseren ingen
 * `focusout`, og tastaturet ville blitt liggende avslått til man lastet siden
 * på nytt.
 */

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable;
}

/** Kobler på lytterne. Returnerer en opprydningsfunksjon. */
export function pauseGameKeysWhileTyping(game: Game): () => void {
  const setEnabled = (enabled: boolean) => {
    const keyboard = game.input?.keyboard;
    if (!keyboard || keyboard.enabled === enabled) return;

    keyboard.enabled = enabled;

    if (!enabled) {
      // Uten dette henger tasten du holdt inne igjen som «nede», og figuren
      // fortsetter å gå mens du skriver.
      for (const scene of game.scene.getScenes(true)) {
        scene.input?.keyboard?.resetKeys();
      }
    }
  };

  /** Spillet skal ha tastaturet så lenge du ikke står i et skrivefelt. */
  const sync = () => setEnabled(!isEditable(document.activeElement));

  // Capture-fasen kjører før Phaser sin egen lytter på window, så avgjørelsen
  // er tatt før spillet rekker å spise tastetrykket.
  window.addEventListener("keydown", sync, true);
  window.addEventListener("keyup", sync, true);

  // Slår av med én gang du klikker i et felt, så figuren ikke fortsetter å gå
  // på en tast du allerede holdt nede.
  document.addEventListener("focusin", sync);

  sync();

  return () => {
    window.removeEventListener("keydown", sync, true);
    window.removeEventListener("keyup", sync, true);
    document.removeEventListener("focusin", sync);
  };
}
