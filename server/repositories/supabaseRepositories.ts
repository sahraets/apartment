import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Item, ItemUpdate, NewItemInput, Room } from "@/types";
import { createMockRepositories } from "./mockRepositories";
import type {
  ItemRepository,
  Repositories,
  RoomRepository,
} from "./types";

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase-miljøvariabler mangler (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }
  return createClient(url, key);
}

/** Rad-formen i databasen (snake_case) — konverteres til appens camelCase-type. */
interface ItemRow {
  id: string;
  room_id: string;
  name: string;
  price: number;
  status: Item["status"];
  kind: Item["kind"];
  image_url: string | null;
  url: string | null;
  note: string | null;
  created_at: string;
}

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    roomId: row.room_id,
    name: row.name,
    price: row.price,
    status: row.status,
    kind: row.kind ?? null,
    imageUrl: row.image_url,
    url: row.url,
    note: row.note,
    createdAt: row.created_at,
  };
}

class SupabaseRoomRepository implements RoomRepository {
  async listRooms(): Promise<Room[]> {
    const { data, error } = await getClient().from("rooms").select("*");
    if (error) throw error;
    return data as Room[];
  }

  async findRoom(roomId: string): Promise<Room | null> {
    const { data, error } = await getClient()
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();
    if (error) throw error;
    return data as Room | null;
  }

  async updateBudget(roomId: string, budget: number): Promise<Room | null> {
    const { data, error } = await getClient()
      .from("rooms")
      .update({ budget })
      .eq("id", roomId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Room | null;
  }
}

class SupabaseItemRepository implements ItemRepository {
  async listItems(): Promise<Item[]> {
    const { data, error } = await getClient().from("items").select("*");
    if (error) throw error;
    return (data as ItemRow[]).map(toItem);
  }

  async listItemsByRoom(roomId: string): Promise<Item[]> {
    const { data, error } = await getClient()
      .from("items")
      .select("*")
      .eq("room_id", roomId);
    if (error) throw error;
    return (data as ItemRow[]).map(toItem);
  }

  async findItem(itemId: string): Promise<Item | null> {
    const { data, error } = await getClient()
      .from("items")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();
    if (error) throw error;
    return data ? toItem(data as ItemRow) : null;
  }

  async createItem(input: NewItemInput): Promise<Item> {
    const { data, error } = await getClient()
      .from("items")
      .insert({
        room_id: input.roomId,
        name: input.name,
        price: input.price,
        status: input.status,
        // Sendes bare når den er satt, slik at ting uten møbeltype kan legges
        // til selv om `kind`-kolonnen ikke er lagt på databasen ennå.
        ...(input.kind ? { kind: input.kind } : {}),
        image_url: input.imageUrl ?? null,
        url: input.url ?? null,
        note: input.note ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return toItem(data as ItemRow);
  }

  async updateItem(itemId: string, patch: ItemUpdate): Promise<Item | null> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.price !== undefined) update.price = patch.price;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.kind !== undefined) update.kind = patch.kind;
    if (patch.imageUrl !== undefined) update.image_url = patch.imageUrl;
    if (patch.url !== undefined) update.url = patch.url;
    if (patch.note !== undefined) update.note = patch.note;

    const { data, error } = await getClient()
      .from("items")
      .update(update)
      .eq("id", itemId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? toItem(data as ItemRow) : null;
  }

  async deleteItem(itemId: string): Promise<boolean> {
    const { error, count } = await getClient()
      .from("items")
      .delete({ count: "exact" })
      .eq("id", itemId);
    if (error) throw error;
    return (count ?? 0) > 0;
  }
}

export function createSupabaseRepositories(): Repositories {
  return {
    rooms: new SupabaseRoomRepository(),
    items: new SupabaseItemRepository(),
    // Bilder bruker fortsatt mock inntil Supabase Storage kobles på som eget steg.
    images: createMockRepositories().images,
  };
}