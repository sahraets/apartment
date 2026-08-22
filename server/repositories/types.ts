import type { Item, ItemUpdate, NewItemInput, Room } from "@/types";

/**
 * Repository-kontrakten. Dette er det eneste laget som skal snakke med en
 * datakilde. Alt over (services, controllers, UI, spill) kjenner bare disse
 * metodene — derfor kan mock byttes mot Supabase uten endringer oppover.
 */
export interface RoomRepository {
  listRooms(): Promise<Room[]>;
  findRoom(roomId: string): Promise<Room | null>;
  updateBudget(roomId: string, budget: number): Promise<Room | null>;
}

export interface ItemRepository {
  listItems(): Promise<Item[]>;
  listItemsByRoom(roomId: string): Promise<Item[]>;
  findItem(itemId: string): Promise<Item | null>;
  createItem(input: NewItemInput): Promise<Item>;
  updateItem(itemId: string, patch: ItemUpdate): Promise<Item | null>;
  deleteItem(itemId: string): Promise<boolean>;
}

export interface StoredImage {
  contentType: string;
  bytes: Uint8Array;
}

/** Lagring av opplastede bilder. Mock legger dem i minnet, Supabase i Storage. */
export interface ImageRepository {
  /** Returnerer en URL som `<img src>` kan bruke direkte. */
  saveImage(fileName: string, contentType: string, bytes: Uint8Array): Promise<string>;
  /**
   * Leser bildet ut igjen. Kun implementert av lagre som appen selv må
   * servere fra (mock). Supabase Storage gir en offentlig URL og trenger den
   * ikke — da er metoden utelatt.
   */
  readImage?(imageId: string): Promise<StoredImage | null>;
}

export interface Repositories {
  rooms: RoomRepository;
  items: ItemRepository;
  images: ImageRepository;
}
