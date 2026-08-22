import { randomUUID } from "node:crypto";

import type { Item, ItemUpdate, NewItemInput, Room } from "@/types";
import { getMockDatabase } from "./mockStore";
import type {
  ImageRepository,
  ItemRepository,
  Repositories,
  RoomRepository,
} from "./types";

/** Kopier ut av lageret så kallere ikke kan mutere "databasen" ved et uhell. */
const clone = <T>(value: T): T => structuredClone(value);

class MockRoomRepository implements RoomRepository {
  async listRooms(): Promise<Room[]> {
    return clone(getMockDatabase().rooms);
  }

  async findRoom(roomId: string): Promise<Room | null> {
    const room = getMockDatabase().rooms.find((r) => r.id === roomId);
    return room ? clone(room) : null;
  }

  async updateBudget(roomId: string, budget: number): Promise<Room | null> {
    const db = getMockDatabase();
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) return null;
    room.budget = budget;
    return clone(room);
  }
}

class MockItemRepository implements ItemRepository {
  async listItems(): Promise<Item[]> {
    return clone(getMockDatabase().items);
  }

  async listItemsByRoom(roomId: string): Promise<Item[]> {
    return clone(getMockDatabase().items.filter((item) => item.roomId === roomId));
  }

  async findItem(itemId: string): Promise<Item | null> {
    const item = getMockDatabase().items.find((i) => i.id === itemId);
    return item ? clone(item) : null;
  }

  async createItem(input: NewItemInput): Promise<Item> {
    const item: Item = {
      id: randomUUID(),
      roomId: input.roomId,
      name: input.name,
      price: input.price,
      status: input.status,
      kind: input.kind ?? null,
      imageUrl: input.imageUrl ?? null,
      url: input.url ?? null,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
    };
    getMockDatabase().items.push(item);
    return clone(item);
  }

  async updateItem(itemId: string, patch: ItemUpdate): Promise<Item | null> {
    const db = getMockDatabase();
    const item = db.items.find((i) => i.id === itemId);
    if (!item) return null;
    Object.assign(item, patch);
    return clone(item);
  }

  async deleteItem(itemId: string): Promise<boolean> {
    const db = getMockDatabase();
    const index = db.items.findIndex((i) => i.id === itemId);
    if (index === -1) return false;
    db.items.splice(index, 1);
    return true;
  }
}

class MockImageRepository implements ImageRepository {
  async saveImage(
    fileName: string,
    contentType: string,
    bytes: Uint8Array,
  ): Promise<string> {
    const extension = fileName.includes(".") ? fileName.split(".").pop() : "bin";
    const id = `${randomUUID()}.${extension}`;
    getMockDatabase().images.set(id, { contentType, bytes });
    return `/api/uploads/${id}`;
  }

  async readImage(imageId: string) {
    return getMockDatabase().images.get(imageId) ?? null;
  }
}

export function createMockRepositories(): Repositories {
  return {
    rooms: new MockRoomRepository(),
    items: new MockItemRepository(),
    images: new MockImageRepository(),
  };
}
