/**
 * Delte modeller. Brukes av spill, UI, client-services og backend.
 * Ingen av disse typene kjenner til datakilden (mock/Supabase).
 */

/** Livsløpet til en ting: ønsket -> bestilt -> kjøpt. */
export type ItemStatus = "wished" | "ordered" | "bought";

export const ITEM_STATUSES: ItemStatus[] = ["wished", "ordered", "bought"];

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  wished: "Ønsket",
  ordered: "Bestilt",
  bought: "Kjøpt",
};

/**
 * Møbeltypene spillet vet hvordan det skal tegne. En ting uten type vises
 * bare i lista — den dukker ikke opp på kartet.
 *
 * Størrelse og farge for hver type ligger i `game/furniture.ts`, altså i
 * spill-laget. Her holder vi bare på selve navnet, som er det databasen lagrer.
 */
export type FurnitureKind =
  | "sofa"
  | "spisebord"
  | "stol"
  | "seng"
  | "tvbenk"
  | "hylle"
  | "skap"
  | "kommode"
  | "lenestol"
  | "teppe"
  | "plante"
  | "lampe";

export const FURNITURE_KINDS: FurnitureKind[] = [
  "sofa",
  "lenestol",
  "spisebord",
  "stol",
  "tvbenk",
  "kommode",
  "hylle",
  "skap",
  "seng",
  "teppe",
  "plante",
  "lampe",
];

export const FURNITURE_KIND_LABELS: Record<FurnitureKind, string> = {
  sofa: "Sofa",
  lenestol: "Lenestol",
  spisebord: "Spisebord",
  stol: "Stol",
  tvbenk: "TV-benk",
  kommode: "Kommode",
  hylle: "Hylle",
  skap: "Skap",
  seng: "Seng",
  teppe: "Teppe",
  plante: "Plante",
  lampe: "Lampe",
};

export function isFurnitureKind(value: unknown): value is FurnitureKind {
  return FURNITURE_KINDS.includes(value as FurnitureKind);
}

/** Et rom i leiligheten. `id` er en slug som også brukes som sone-id i spillet. */
export interface Room {
  id: string;
  name: string;
  /** Satt budsjett for rommet, i hele kroner. */
  budget: number;
  /** Kort beskrivelse som vises øverst i rompanelet. */
  description: string;
}

/** En ting man ønsker seg / har kjøpt til et rom. */
export interface Item {
  id: string;
  roomId: string;
  name: string;
  /** Pris i hele kroner. */
  price: number;
  status: ItemStatus;
  /** Møbeltype, hvis tingen skal tegnes i spillet. */
  kind: FurnitureKind | null;
  imageUrl: string | null;
  /** Lenke til nettbutikk e.l. */
  url: string | null;
  note: string | null;
  /** ISO-8601. */
  createdAt: string;
}

/** Utregnet budsjettstatus for ett rom. Aldri lagret — alltid derivert. */
export interface Budget {
  roomId: string;
  /** Satt budsjett. */
  planned: number;
  /** Sum av ting med status "bought". */
  spent: number;
  /** Sum av "bought" + "ordered" — penger som reelt er bundet opp. */
  committed: number;
  /** Sum av ting med status "wished". */
  wished: number;
  /** planned - committed. Kan være negativ. */
  remaining: number;
  /** committed / planned i prosent (0 hvis planned er 0). */
  usedPercent: number;
}

/** Alt UI-et trenger for å tegne ett rompanel. */
export interface RoomOverview {
  room: Room;
  items: Item[];
  budget: Budget;
}

/** Felter brukeren kan sende inn når en ny ting legges til. */
export interface NewItemInput {
  roomId: string;
  name: string;
  price: number;
  status: ItemStatus;
  kind?: FurnitureKind | null;
  imageUrl?: string | null;
  url?: string | null;
  note?: string | null;
}

/** Felter som kan endres på en eksisterende ting. Alle valgfrie. */
export interface ItemUpdate {
  name?: string;
  price?: number;
  status?: ItemStatus;
  kind?: FurnitureKind | null;
  imageUrl?: string | null;
  url?: string | null;
  note?: string | null;
}

/** Totalsummer på tvers av alle rom, til topplinja. */
export interface BudgetSummary {
  planned: number;
  spent: number;
  committed: number;
  wished: number;
  remaining: number;
  usedPercent: number;
}
