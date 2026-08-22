import {
  isFurnitureKind,
  type FurnitureKind,
  type Item,
} from "@/types";
import {
  isWalkable,
  Tile,
  type Doorway,
  type FloorPlan,
  type RoomArea,
  type TileValue,
} from "./apartment";

/**
 * Møblene spillet kan tegne: hvor stort et møbel er, hvilken farge det har,
 * og om man kan gå på det.
 *
 * Størrelsene er i ruter. En rute er ca. en halvmeter, så en sofa på 4x2 er
 * omtrent to meter bred.
 */
export interface FurnitureSpec {
  w: number;
  h: number;
  color: number;
  /** Tepper ligger på gulvet — man skal kunne gå over dem. */
  walkable?: boolean;
  /**
   * Hvor møbelet helst vil stå. De fleste møbler står inntil en vegg;
   * spisebord og tepper hører hjemme midt i rommet.
   */
  spot?: "vegg" | "midten";
}

export const FURNITURE: Record<FurnitureKind, FurnitureSpec> = {
  sofa: { w: 4, h: 2, color: 0x6f8f6a, spot: "vegg" },
  lenestol: { w: 2, h: 2, color: 0x7d9a77, spot: "vegg" },
  spisebord: { w: 3, h: 2, color: 0x7a4f30, spot: "midten" },
  stol: { w: 1, h: 1, color: 0xa8734a, spot: "midten" },
  tvbenk: { w: 3, h: 1, color: 0x4a4a52, spot: "vegg" },
  kommode: { w: 2, h: 1, color: 0x9c7a5b, spot: "vegg" },
  hylle: { w: 2, h: 1, color: 0x8a6f52, spot: "vegg" },
  skap: { w: 2, h: 3, color: 0x9c7a5b, spot: "vegg" },
  seng: { w: 3, h: 4, color: 0x8fa8c8, spot: "vegg" },
  teppe: { w: 4, h: 3, color: 0xd8c3a5, walkable: true, spot: "midten" },
  plante: { w: 1, h: 1, color: 0x4f7a4a, spot: "vegg" },
  lampe: { w: 1, h: 1, color: 0xe0c878, spot: "vegg" },
};

/**
 * Gjetter møbeltype ut fra navnet på tingen.
 *
 * Brukes bare når `kind` ikke er satt, slik at ting som allerede lå i basen før
 * møbeltypene fantes fortsatt dukker opp på kartet. Velger man en type i
 * skjemaet, er det alltid den som gjelder.
 */
export function guessKind(name: string): FurnitureKind | null {
  const text = name.toLowerCase();

  // Lengste treff først, ellers ville «bord» stjålet «spisebord».
  const patterns: [string, FurnitureKind][] = [
    ["spisebord", "spisebord"],
    ["tv-benk", "tvbenk"],
    ["tvbenk", "tvbenk"],
    ["lenestol", "lenestol"],
    ["sofa", "sofa"],
    ["stol", "stol"],
    ["seng", "seng"],
    ["kommode", "kommode"],
    ["hylle", "hylle"],
    ["skap", "skap"],
    ["teppe", "teppe"],
    ["plante", "plante"],
    ["lampe", "lampe"],
    ["bord", "spisebord"],
  ];

  for (const [needle, kind] of patterns) {
    if (text.includes(needle)) return kind;
  }
  return null;
}

/** Møbeltypen en ting skal tegnes som, hvis noen. */
export function kindOf(item: Item): FurnitureKind | null {
  if (isFurnitureKind(item.kind)) return item.kind;
  return guessKind(item.name);
}

/** Et møbel som har fått plass, klart til å tegnes. */
export interface Placement {
  itemId: string;
  name: string;
  kind: FurnitureKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  walkable: boolean;
}

/** Rutene rundt dørene holdes frie, så et møbel ikke setter seg i døråpningen. */
function doorwayTiles(doorways: Doorway[]): Set<string> {
  const blocked = new Set<string>();

  for (const door of doorways) {
    for (let i = 0; i < door.length; i++) {
      const x = door.orientation === "horizontal" ? door.x + i : door.x;
      const y = door.orientation === "horizontal" ? door.y : door.y + i;
      blocked.add(`${x},${y}`);
      // Ruta på hver side, så man kommer seg gjennom åpningen.
      if (door.orientation === "horizontal") {
        blocked.add(`${x},${y - 1}`);
        blocked.add(`${x},${y + 1}`);
      } else {
        blocked.add(`${x - 1},${y}`);
        blocked.add(`${x + 1},${y}`);
      }
    }
  }

  return blocked;
}

/** Alle gåbare ruter man faktisk kommer til fra et startpunkt. */
function reachableFrom(
  grid: TileValue[][],
  start: { x: number; y: number },
): Set<string> {
  const seen = new Set<string>([`${start.x},${start.y}`]);
  const queue = [start];

  while (queue.length > 0) {
    const { x, y } = queue.pop()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key)) continue;
      if (!isWalkable(grid[ny]?.[nx])) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  return seen;
}

/**
 * Stenger møbelet noen inne? Hver rute man kunne nå før, og som fortsatt er
 * gulv, må man kunne nå etterpå også. Rutene møbelet selv dekker teller ikke.
 */
function stillReachable(
  grid: TileValue[][],
  before: Set<string>,
  start: { x: number; y: number },
): boolean {
  const after = reachableFrom(grid, start);

  for (const key of before) {
    if (after.has(key)) continue;

    const [x, y] = key.split(",").map(Number);
    // Ruta ble dekket av selve møbelet — det er greit.
    if (!isWalkable(grid[y]?.[x])) continue;

    return false;
  }
  return true;
}

/**
 * Finner plass til møblene i rommene sine.
 *
 * For hvert møbel vurderes alle ledige flekker i rommet, og den beste velges:
 * sofaer og skap vil stå inntil en vegg, spisebord og tepper midt i rommet, og
 * stoler helst inntil spisebordet. Møbler som ville sperret veien for spilleren
 * blir stående over — da vises tingen bare i lista.
 */
export function planFurniture(
  floor: FloorPlan,
  grid: TileValue[][],
  items: Item[],
  start: { x: number; y: number },
): Placement[] {
  const roomsById = new Map(floor.rooms.map((room) => [room.id, room]));
  const reserved = doorwayTiles(floor.doorways);
  // Spilleren skal ikke våkne opp inni en sofa.
  reserved.add(`${start.x},${start.y}`);
  const placements: Placement[] = [];

  const fits = (area: RoomArea, x: number, y: number, w: number, h: number) => {
    if (x < area.x + 1 || y < area.y + 1) return false;
    if (x + w > area.x + area.w - 1 || y + h > area.y + area.h - 1) return false;

    for (let ty = y; ty < y + h; ty++) {
      for (let tx = x; tx < x + w; tx++) {
        if (grid[ty]?.[tx] !== Tile.Floor) return false;
        if (reserved.has(`${tx},${ty}`)) return false;
      }
    }
    return true;
  };

  /** Ligger møbelet inntil noe fast — vegg, kjøkken eller trapp? */
  const touchesWall = (x: number, y: number, w: number, h: number) => {
    for (let ty = y - 1; ty <= y + h; ty++) {
      for (let tx = x - 1; tx <= x + w; tx++) {
        const inside = tx >= x && tx < x + w && ty >= y && ty < y + h;
        if (inside) continue;
        if (!isWalkable(grid[ty]?.[tx])) return true;
      }
    }
    return false;
  };

  const distance = (
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  for (const item of items) {
    const kind = kindOf(item);
    if (!kind) continue;

    const area = roomsById.get(item.roomId);
    if (!area) continue; // Rommet hører til en annen etasje.

    const spec = FURNITURE[kind];
    const center = {
      x: area.x + area.w / 2 - spec.w / 2,
      y: area.y + area.h / 2 - spec.h / 2,
    };
    const inSameRoom = placements.filter((p) => {
      const room = roomsById.get(item.roomId);
      return (
        room !== undefined &&
        p.x >= room.x &&
        p.x < room.x + room.w &&
        p.y >= room.y &&
        p.y < room.y + room.h
      );
    });
    const table = inSameRoom.find((p) => p.kind === "spisebord");

    const candidates: { x: number; y: number; score: number }[] = [];

    for (let y = area.y + 1; y < area.y + area.h - 1; y++) {
      for (let x = area.x + 1; x < area.x + area.w - 1; x++) {
        if (!fits(area, x, y, spec.w, spec.h)) continue;

        let score = 0;

        if (spec.spot === "midten") {
          // Nær midten er bra, langt fra midten er dårlig.
          score -= distance({ x, y }, center);
        } else if (touchesWall(x, y, spec.w, spec.h)) {
          score += 12;
        }

        // Stoler hører til bordet.
        if (kind === "stol" && table) {
          score += 20 - 3 * distance({ x, y }, table);
        }

        // Ellers: hold avstand til møblene som allerede står der, så det ikke
        // hoper seg opp i ett hjørne.
        const nearest = inSameRoom.reduce(
          (min, p) => Math.min(min, distance({ x, y }, p)),
          Number.POSITIVE_INFINITY,
        );
        if (Number.isFinite(nearest)) score += Math.min(nearest, 6);

        candidates.push({ x, y, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    for (const candidate of candidates) {
      const placement: Placement = {
        itemId: item.id,
        name: item.name,
        kind,
        x: candidate.x,
        y: candidate.y,
        w: spec.w,
        h: spec.h,
        color: spec.color,
        walkable: spec.walkable ?? false,
      };

      // Tepper sperrer ingenting og kan legges rett ned.
      if (placement.walkable) {
        placements.push(placement);
        break;
      }

      // Sett møbelet ned, og angre hvis det stenger veien for noen.
      const before = reachableFrom(grid, start);
      for (let ty = candidate.y; ty < candidate.y + spec.h; ty++) {
        for (let tx = candidate.x; tx < candidate.x + spec.w; tx++) {
          grid[ty][tx] = Tile.Furniture;
        }
      }

      if (stillReachable(grid, before, start)) {
        placements.push(placement);
        break;
      }

      for (let ty = candidate.y; ty < candidate.y + spec.h; ty++) {
        for (let tx = candidate.x; tx < candidate.x + spec.w; tx++) {
          grid[ty][tx] = Tile.Floor;
        }
      }
    }
  }

  return placements;
}
