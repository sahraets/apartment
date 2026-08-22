import type { Budget, BudgetSummary, Room } from "@/types";

/**
 * Client-service for rom.
 *
 * Spillet og UI-et kaller disse funksjonene — aldri `fetch` direkte. Da ligger
 * alle endepunkt-URL-er ett sted, og et bytte av backend merkes ikke oppover.
 */

export interface RoomsResult {
  rooms: Room[];
  budgets: Budget[];
  summary: BudgetSummary;
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Forespørselen feilet (${response.status})`);
  }

  return response.json() as Promise<T>;
}

/** Henter alle rom med utregnet budsjett. */
export function fetchRooms(): Promise<RoomsResult> {
  return request<RoomsResult>("/api/rooms");
}