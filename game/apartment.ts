/**
 * Planløsningen for leiligheten, i ruter.
 * Ingen avhengighet til Phaser — dette er bare tall.
 *
 * Leiligheten har to etasjer: hovedetasjen og sovehemsen over stua.
 * Begge tegnes i samme rutenett-størrelse, så lerretet er like stort
 * uansett hvilken etasje du står i — sovehemsen fyller bare mindre av det.
 */

export const TILE_SIZE = 16;
export const MAP_WIDTH = 17;
export const MAP_HEIGHT = 26;

export const Tile = {
  Void: 0,
  Floor: 1,
  Wall: 2,
  /** Trapp — går du hit, bytter du etasje. */
  Stairs: 3,
  Bed: 4,
  Wardrobe: 5,
  /** Skråtak: ikke tellende bruksareal, men du kommer deg fram (bøyd). */
  LowCeiling: 6,
  /** Kjøkkeninnredningen langs veggen — fulgte med leiligheten. */
  Kitchen: 7,
  /** Møbler som kommer fra databasen. Fargen bestemmes av møbeltypen. */
  Furniture: 8,
} as const;
export type TileValue = (typeof Tile)[keyof typeof Tile];

/** Ruter du kan stå på. Møbler og vegger sperrer. */
const WALKABLE = new Set<TileValue>([Tile.Floor, Tile.Stairs, Tile.LowCeiling]);

export function isWalkable(tile: TileValue | undefined): boolean {
  return tile !== undefined && WALKABLE.has(tile);
}

/** Et rom, med veggene inkludert. `id` må matche Room.id fra API-et. */
export interface RoomArea {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Doorway {
  x: number;
  y: number;
  length: number;
  orientation: "horizontal" | "vertical";
}

/** Et rektangel som males oppå gulvet etter at rommene er hult ut. */
export interface Patch {
  tile: TileValue;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * En trapp sett fra én etasje: rutene den dekker her, og hvor du havner
 * når du går i den. Landingspunktet må ligge på en gåbar rute som ikke er
 * trapp, ellers sendes du rett tilbake igjen.
 */
export interface StairLink {
  x: number;
  y: number;
  w: number;
  h: number;
  to: FloorId;
  /** Rute-koordinat du lander på i etasjen du kommer til. */
  landingX: number;
  landingY: number;
}

export type FloorId = "hovedetasje" | "sovehems";

export interface FloorPlan {
  id: FloorId;
  name: string;
  rooms: RoomArea[];
  doorways: Doorway[];
  /** Møbler, skråtak og annet som males oppå gulvet. */
  patches: Patch[];
  stairs: StairLink[];
  /** Hvor spilleren starter når spillet lastes (bare hovedetasjen bruker den). */
  spawn?: { x: number; y: number };
}

const HOVEDETASJE: FloorPlan = {
  id: "hovedetasje",
  name: "Hovedetasje",
  rooms: [
    { id: "gang", x: 0, y: 0, w: 8, h: 6 },
    { id: "bad", x: 7, y: 0, w: 10, h: 6 },
    { id: "stue", x: 0, y: 5, w: 17, h: 14 },
    { id: "takterrasse", x: 0, y: 18, w: 10, h: 8 },
  ],
  doorways: [
    { x: 7, y: 2, length: 2, orientation: "vertical" }, // gang  -> bad
    { x: 2, y: 5, length: 3, orientation: "horizontal" }, // gang  -> stue
    { x: 3, y: 18, length: 3, orientation: "horizontal" }, // stue  -> takterrasse
  ],
  patches: [
    // Kjøkkenet er fast inventar og hører til leiligheten, ikke til
    // handlelista. Øverste rad (y=6) holdes fri, så du kommer inn døra fra
    // gangen og videre ut i rommet. Alle andre møbler kommer fra databasen.
    { tile: Tile.Kitchen, x: 1, y: 7, w: 2, h: 11 },
  ],
  stairs: [
    // Trappa står i hjørnet av stua, mot badveggen.
    { x: 13, y: 6, w: 3, h: 3, to: "sovehems", landingX: 11, landingY: 6 },
  ],
};

/**
 * Sovehemsen: 6 m² ståhøyde med skråtak mot ytterveggene.
 * Seng langs kortveggen, garderobe på langveggen, trapp opp i hjørnet.
 */
const SOVEHEMS: FloorPlan = {
  id: "sovehems",
  name: "Sovehems",
  rooms: [{ id: "sovehems", x: 2, y: 2, w: 14, h: 15 }],
  doorways: [],
  patches: [
    // Skråtak langs toppen — «ikke tellende bruksareal utenfor stiplet linje».
    { tile: Tile.LowCeiling, x: 3, y: 3, w: 12, h: 2 },
    // Garderobeplass på langveggen.
    { tile: Tile.Wardrobe, x: 3, y: 5, w: 2, h: 5 },
    // Senga mot kortveggen i enden.
    { tile: Tile.Bed, x: 3, y: 11, w: 4, h: 5 },
  ],
  stairs: [
    { x: 12, y: 5, w: 3, h: 3, to: "hovedetasje", landingX: 12, landingY: 9 },
  ],
};

export const FLOORS: Record<FloorId, FloorPlan> = {
  hovedetasje: HOVEDETASJE,
  sovehems: SOVEHEMS,
};

export const START_FLOOR: FloorId = "hovedetasje";

/** Rommene i hovedetasjen. Beholdt som egen eksport for lesbarhet. */
export const ROOM_AREAS = HOVEDETASJE.rooms;

/**
 * Bygger rutenettet for én etasje: fyll hvert rom helt med vegg, hul ut
 * innsiden til gulv, skjær hull der dørene skal være, og mal til slutt
 * møbler og trapper oppå.
 */
export function buildTileGrid(floor: FloorPlan): TileValue[][] {
  const grid: TileValue[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, (): TileValue => Tile.Void),
  );

  const paint = (x: number, y: number, tile: TileValue) => {
    const row = grid[y];
    if (row && x >= 0 && x < MAP_WIDTH) row[x] = tile;
  };

  for (const area of floor.rooms) {
    for (let y = area.y; y < area.y + area.h; y++) {
      for (let x = area.x; x < area.x + area.w; x++) {
        paint(x, y, Tile.Wall);
      }
    }

    for (let y = area.y + 1; y < area.y + area.h - 1; y++) {
      for (let x = area.x + 1; x < area.x + area.w - 1; x++) {
        paint(x, y, Tile.Floor);
      }
    }
  }

  for (const door of floor.doorways) {
    for (let i = 0; i < door.length; i++) {
      const x = door.orientation === "horizontal" ? door.x + i : door.x;
      const y = door.orientation === "horizontal" ? door.y : door.y + i;
      paint(x, y, Tile.Floor);
    }
  }

  for (const patch of floor.patches) {
    for (let y = patch.y; y < patch.y + patch.h; y++) {
      for (let x = patch.x; x < patch.x + patch.w; x++) {
        paint(x, y, patch.tile);
      }
    }
  }

  for (const stair of floor.stairs) {
    for (let y = stair.y; y < stair.y + stair.h; y++) {
      for (let x = stair.x; x < stair.x + stair.w; x++) {
        paint(x, y, Tile.Stairs);
      }
    }
  }

  return grid;
}

/** Trappa spilleren står i, hvis noen. */
export function stairAt(
  floor: FloorPlan,
  tileX: number,
  tileY: number,
): StairLink | undefined {
  return floor.stairs.find(
    (stair) =>
      tileX >= stair.x &&
      tileX < stair.x + stair.w &&
      tileY >= stair.y &&
      tileY < stair.y + stair.h,
  );
}

/** Innsiden av et rom i piksler — brukes som utløsersone i spillet. */
export function roomInterior(area: RoomArea) {
  return {
    x: (area.x + 1) * TILE_SIZE,
    y: (area.y + 1) * TILE_SIZE,
    width: (area.w - 2) * TILE_SIZE,
    height: (area.h - 2) * TILE_SIZE,
  };
}

/** Senter av en rute i piksler. */
export function tileCenter(tileX: number, tileY: number) {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
  };
}