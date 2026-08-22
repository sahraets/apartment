import type { Item, Room } from "@/types";

/**
 * Delt in-memory-lager for mock-repositoriene.
 *
 * Lagres på globalThis slik at data overlever hot reload i `next dev`.
 * Merk: dette er per prosess — i produksjon (serverless) nullstilles det, og
 * to samboere ser ikke hverandres data. Mock er kun for utvikling; ekte deling
 * kommer når Supabase-repositoriene kobles på.
 */
export interface MockImage {
  contentType: string;
  bytes: Uint8Array;
}

export interface MockDatabase {
  rooms: Room[];
  items: Item[];
  images: Map<string, MockImage>;
}

const seedRooms = (): Room[] => [
  {
      id: "gang",
      name: "Gang",
      budget: 8000,
      description: "Knagger, skohylle og et speil ved døra.",
    },
    {
      id: "bad",
      name: "Bad",
      budget: 6000,
      description: "Speil, oppbevaring og håndklær.",
    },
    {
      id: "stue",
      name: "Stue/kjøk./trapp",
      budget: 65000,
      description: "Sofa, TV-benk, spisebord og kjøkkenutstyr — og trappa opp til loftet.",
    },
    {
      id: "takterrasse",
      name: "Takterrasse",
      budget: 5000,
      description: "Bord, stoler og planter for kvelder ute.",
    },
  ];

  const seedItems = (): Item[] => [
    {
      id: "seed-sofa",
      roomId: "stue",
      name: "3-seter sofa",
      price: 18990,
      status: "wished",
      kind: null,
      imageUrl: null,
      url: null,
      note: "Helst med avtakbart trekk.",
      createdAt: "2026-08-01T09:00:00.000Z",
    },
    {
      id: "seed-tvbenk",
      roomId: "stue",
      name: "TV-benk i eik",
      price: 4200,
      status: "ordered",
      kind: null,
      imageUrl: null,
      url: null,
      note: "Bestilt, leveres uke 36.",
      createdAt: "2026-08-02T10:30:00.000Z",
    },
    {
      id: "seed-spisebord",
      roomId: "stue",
      name: "Spisebord 140 cm",
      price: 5990,
      status: "bought",
      kind: null,
      imageUrl: null,
      url: null,
      note: "Hentet på lager.",
      createdAt: "2026-08-03T14:15:00.000Z",
    },
    // seed-seng (soverom) kommer tilbake når loftet/etasje 2 modelleres.
    {
      id: "seed-speil",
      roomId: "bad",
      name: "Speil med lys",
      price: 1790,
      status: "bought",
      kind: null,
      imageUrl: null,
      url: null,
      note: null,
      createdAt: "2026-08-05T08:20:00.000Z",
    },
  ];

const globalRef = globalThis as typeof globalThis & {
  __leilighetMockDb?: MockDatabase;
};

export function getMockDatabase(): MockDatabase {
  if (!globalRef.__leilighetMockDb) {
    globalRef.__leilighetMockDb = {
      rooms: seedRooms(),
      items: seedItems(),
      images: new Map(),
    };
  }
  return globalRef.__leilighetMockDb;
}

/** Kun for tester / manuell nullstilling under utvikling. */
export function resetMockDatabase(): void {
  globalRef.__leilighetMockDb = undefined;
}
