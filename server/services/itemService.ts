import { getRepositories } from "@/server/repositories";
import type {
  FurnitureKind,
  Item,
  ItemStatus,
  ItemUpdate,
  NewItemInput,
} from "@/types";
import { isFurnitureKind, ITEM_STATUSES } from "@/types";
import { NotFoundError, ValidationError } from "./errors";

const MAX_NAME_LENGTH = 120;
const MAX_NOTE_LENGTH = 500;
const MAX_PRICE = 1_000_000;

function parseName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) throw new ValidationError("Tingen må ha et navn");
  if (name.length > MAX_NAME_LENGTH) {
    throw new ValidationError(`Navnet kan være maks ${MAX_NAME_LENGTH} tegn`);
  }
  return name;
}

function parsePrice(value: unknown): number {
  const price = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new ValidationError("Pris må være et positivt tall");
  }
  if (price > MAX_PRICE) {
    throw new ValidationError("Pris ser urimelig høy ut");
  }
  return Math.round(price);
}

function parseStatus(value: unknown): ItemStatus {
  if (!ITEM_STATUSES.includes(value as ItemStatus)) {
    throw new ValidationError(
      `Status må være en av: ${ITEM_STATUSES.join(", ")}`,
    );
  }
  return value as ItemStatus;
}

/** Møbeltype er valgfri — tomt betyr «vises ikke på kartet». */
function parseKind(value: unknown): FurnitureKind | null {
  if (value === undefined || value === null || value === "") return null;
  if (!isFurnitureKind(value)) {
    throw new ValidationError(`Ukjent møbeltype: ${String(value)}`);
  }
  return value;
}

function parseOptionalText(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (text.length > maxLength) {
    throw new ValidationError(`Teksten kan være maks ${maxLength} tegn`);
  }
  return text;
}

function parseOptionalUrl(value: unknown): string | null {
  const text = parseOptionalText(value, 2000);
  if (!text) return null;
  // Interne opplastinger er relative stier og skal slippe gjennom som de er.
  if (text.startsWith("/")) return text;
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new ValidationError("Lenken må starte med http:// eller https://");
    }
    return parsed.toString();
  } catch {
    throw new ValidationError("Ugyldig lenke");
  }
}

/**
 * Henter ting, enten for hele leiligheten eller for ett rom.
 * Sortert eldst først, så nye ting legger seg nederst i lista i UI-et.
 */
export async function listItems(roomId?: string | null): Promise<Item[]> {
  const { rooms, items } = getRepositories();

  if (roomId) {
    if (!(await rooms.findRoom(roomId))) {
      throw new NotFoundError(`Fant ikke rommet "${roomId}"`);
    }
    return sortByCreatedAt(await items.listItemsByRoom(roomId));
  }

  return sortByCreatedAt(await items.listItems());
}

function sortByCreatedAt(list: Item[]): Item[] {
  return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Validerer og lagrer en ny ting. Rommet må finnes. */
export async function createItem(payload: unknown): Promise<Item> {
  const body = (payload ?? {}) as Record<string, unknown>;
  const roomId = parseOptionalText(body.roomId, 60);
  if (!roomId) throw new ValidationError("roomId mangler");

  const { rooms, items } = getRepositories();
  if (!(await rooms.findRoom(roomId))) {
    throw new NotFoundError(`Fant ikke rommet "${roomId}"`);
  }

  const input: NewItemInput = {
    roomId,
    name: parseName(body.name),
    price: parsePrice(body.price),
    status: parseStatus(body.status ?? "wished"),
    kind: parseKind(body.kind),
    imageUrl: parseOptionalUrl(body.imageUrl),
    url: parseOptionalUrl(body.url),
    note: parseOptionalText(body.note, MAX_NOTE_LENGTH),
  };

  return items.createItem(input);
}

/** Oppdaterer felter på en ting. Bare feltene som sendes inn endres. */
export async function updateItem(
  itemId: string,
  payload: unknown,
): Promise<Item> {
  const body = (payload ?? {}) as Record<string, unknown>;
  const patch: ItemUpdate = {};

  if ("name" in body) patch.name = parseName(body.name);
  if ("price" in body) patch.price = parsePrice(body.price);
  if ("status" in body) patch.status = parseStatus(body.status);
  if ("kind" in body) patch.kind = parseKind(body.kind);
  if ("imageUrl" in body) patch.imageUrl = parseOptionalUrl(body.imageUrl);
  if ("url" in body) patch.url = parseOptionalUrl(body.url);
  if ("note" in body) patch.note = parseOptionalText(body.note, MAX_NOTE_LENGTH);

  if (Object.keys(patch).length === 0) {
    throw new ValidationError("Ingen felter å oppdatere");
  }

  const updated = await getRepositories().items.updateItem(itemId, patch);
  if (!updated) throw new NotFoundError("Fant ikke tingen");
  return updated;
}

export async function deleteItem(itemId: string): Promise<void> {
  const deleted = await getRepositories().items.deleteItem(itemId);
  if (!deleted) throw new NotFoundError("Fant ikke tingen");
}
