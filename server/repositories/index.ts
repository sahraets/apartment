import { createMockRepositories } from "./mockRepositories";
import { createSupabaseRepositories } from "./supabaseRepositories";
import type { Repositories } from "./types";

export type {
  ImageRepository,
  ItemRepository,
  Repositories,
  RoomRepository,
} from "./types";

const globalRef = globalThis as typeof globalThis & {
  __leilighetRepositories?: Repositories;
};

const usingSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * Eneste stedet som bestemmer hvilken datakilde appen kjører mot.
 */
export function getRepositories(): Repositories {
  if (!globalRef.__leilighetRepositories) {
    globalRef.__leilighetRepositories = usingSupabase
      ? createSupabaseRepositories()
      : createMockRepositories();
  }
  return globalRef.__leilighetRepositories;
}

/** True når appen kjører på mock-data (vises som et merke i UI-et). */
export function usingMockData(): boolean {
  return !usingSupabase;
}