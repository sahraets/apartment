import { GameObjects, Scene } from "phaser";
import { fetchItems } from "@/services/itemsService";
import { ITEMS_CHANGED } from "@/services/itemsEvents";
import type { Item } from "@/types";
import {
  buildTileGrid,
  FLOORS,
  roomInterior,
  stairAt,
  START_FLOOR,
  Tile,
  TILE_SIZE,
  tileCenter,
  type FloorId,
} from "./apartment";
import { planFurniture, type Placement } from "./furniture";
import { Player } from "./Player";

const TILE_COLOR: Record<number, number> = {
  [Tile.Floor]: 0xead9c2,
  [Tile.Wall]: 0x3a3a3a,
  [Tile.Stairs]: 0xb08968,
  [Tile.Bed]: 0x8fa8c8,
  [Tile.Wardrobe]: 0x9c7a5b,
  [Tile.LowCeiling]: 0xcbb99c,
  [Tile.Kitchen]: 0x5f6b73,
};

export class ApartmentScene extends Scene {
  private player!: Player;
  private tiles!: GameObjects.Graphics;
  private floorLabel!: GameObjects.Text;
  private currentFloor: FloorId = START_FLOOR;
  /** Hindrer at man trigger trappa på nytt i ruta man lander i. */
  private stairLocked = false;
  /** Tingene fra databasen. Tomt til første henting er ferdig. */
  private items: Item[] = [];
  private placements: Placement[] = [];
  private onItemsChanged = () => {
    void this.loadItems();
  };

  constructor() {
    super("apartment");
  }

  preload() {
    this.load.spritesheet("player", "/sprites/player.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    const floor = FLOORS[this.currentFloor];
    const grid = buildTileGrid(floor);

    this.tiles = this.add.graphics();
    this.drawFloor();

    this.floorLabel = this.add
      .text(4, 4, floor.name, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#f5f0e6",
        backgroundColor: "#00000080",
        padding: { x: 3, y: 2 },
      })
      .setDepth(10);

    const gang = floor.rooms.find((room) => room.id === "gang")!;
    const start = roomInterior(gang);
    this.player = new Player(
      this,
      start.x + start.width / 2,
      start.y + start.height / 2,
      grid,
    );

    void this.loadItems();

    // Lista sier ifra når noe er lagt til eller slettet, så kartet holder seg
    // i takt uten at man må laste siden på nytt.
    window.addEventListener(ITEMS_CHANGED, this.onItemsChanged);
    this.events.once("destroy", () => {
      window.removeEventListener(ITEMS_CHANGED, this.onItemsChanged);
    });
  }

  /** Henter tingene og tegner etasjen på nytt med møblene på plass. */
  private async loadItems() {
    try {
      this.items = await fetchItems();
    } catch (error) {
      // Kartet skal fungere selv om lista ikke lar seg hente.
      console.error("Klarte ikke hente ting til kartet:", error);
      return;
    }

    if (!this.scene.isActive()) return;
    const grid = this.drawFloor();
    this.player.setGrid(grid);
  }

  /**
   * Tegner etasjen spilleren står i nå: først rutene, så møblene fra
   * databasen oppå. `planFurniture` merker rutene møblene sperrer, så
   * rutenettet som returneres er det spilleren skal kollidere mot.
   */
  private drawFloor() {
    const floor = FLOORS[this.currentFloor];
    const grid = buildTileGrid(floor);

    const gang = floor.rooms.find((room) => room.id === "gang");
    const spawn = gang
      ? { x: gang.x + Math.floor(gang.w / 2), y: gang.y + Math.floor(gang.h / 2) }
      : { x: this.player?.tileX ?? 1, y: this.player?.tileY ?? 1 };

    this.placements = planFurniture(floor, grid, this.items, spawn);

    this.tiles.clear();

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const tile = grid[y][x];
        if (tile === Tile.Void || tile === Tile.Furniture) continue;

        this.tiles.fillStyle(TILE_COLOR[tile]);
        this.tiles.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    for (const furniture of this.placements) {
      this.tiles.fillStyle(furniture.color);
      this.tiles.fillRect(
        furniture.x * TILE_SIZE,
        furniture.y * TILE_SIZE,
        furniture.w * TILE_SIZE,
        furniture.h * TILE_SIZE,
      );
    }

    return grid;
  }

  /**
   * Flytter spilleren til den andre etasjen. Vi tegner rutene på nytt og gir
   * spilleren det nye rutenettet, ellers kolliderer den mot forrige etasje.
   */
  private changeFloor(to: FloorId, landingX: number, landingY: number) {
    this.currentFloor = to;
    const grid = this.drawFloor();

    const landing = tileCenter(landingX, landingY);
    this.player.setGrid(grid);
    this.player.moveTo(landing.x, landing.y);

    this.floorLabel.setText(FLOORS[to].name);
    this.stairLocked = true;

    this.cameras.main.flash(150, 0, 0, 0);
  }

  update(time: number, delta: number) {
    this.player.update(delta);

    const stair = stairAt(
      FLOORS[this.currentFloor],
      this.player.tileX,
      this.player.tileY,
    );

    if (!stair) {
      this.stairLocked = false;
      return;
    }

    if (this.stairLocked) return;
    this.changeFloor(stair.to, stair.landingX, stair.landingY);
  }
}