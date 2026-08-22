/**
 * Liten beskjed mellom lista og spillet: «tingene er endret, hent på nytt».
 *
 * RoomList og GameCanvas er søsken i React-treet og deler ingen state. Et
 * vanlig DOM-event er nok her — spillet lever uansett utenfor React.
 */
export const ITEMS_CHANGED = "leilighet:items-changed";

export function notifyItemsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ITEMS_CHANGED));
}
