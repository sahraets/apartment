import { getRepositories } from "@/server/repositories";
import type { Budget, Room, RoomOverview } from "@/types";
import { calculateBudget, summarizeBudgets } from "./budgetService";
import { NotFoundError, ValidationError } from "./errors";

export interface RoomsResponse {
  rooms: Room[];
  budgets: Budget[];
  summary: ReturnType<typeof summarizeBudgets>;
}

/** Alle rom med utregnet budsjett — det spillkartet og topplinja trenger. */
export async function getRooms(): Promise<RoomsResponse> {
  const { rooms, items } = getRepositories();
  const [allRooms, allItems] = await Promise.all([
    rooms.listRooms(),
    items.listItems(),
  ]);

  const budgets = allRooms.map((room) =>
    calculateBudget(
      room,
      allItems.filter((item) => item.roomId === room.id),
    ),
  );

  return { rooms: allRooms, budgets, summary: summarizeBudgets(budgets) };
}

/** Alt ett rompanel trenger: rommet, tingene og budsjettet. */
export async function getRoomOverview(roomId: string): Promise<RoomOverview> {
  const { rooms, items } = getRepositories();
  const room = await rooms.findRoom(roomId);
  if (!room) {
    throw new NotFoundError(`Fant ikke rommet "${roomId}"`);
  }

  const roomItems = await items.listItemsByRoom(roomId);
  const sorted = [...roomItems].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  return { room, items: sorted, budget: calculateBudget(room, sorted) };
}

/** Setter nytt budsjett for et rom. */
export async function setRoomBudget(
  roomId: string,
  budget: number,
): Promise<RoomOverview> {
  if (!Number.isFinite(budget) || budget < 0) {
    throw new ValidationError("Budsjett må være et positivt tall");
  }

  const updated = await getRepositories().rooms.updateBudget(
    roomId,
    Math.round(budget),
  );
  if (!updated) {
    throw new NotFoundError(`Fant ikke rommet "${roomId}"`);
  }

  return getRoomOverview(roomId);
}
