import { GameObjects, Input, Scene, Types } from "phaser";
import { isWalkable, TILE_SIZE, type TileValue } from "./apartment";

const SPEED = 90;

type Direction = "ned" | "opp" | "venstre" | "hoyre";

const FRAME_BY_DIRECTION: Record<Direction, number> = {
  ned: 0,
  opp: 1,
  venstre: 2,
  hoyre: 3,
};

export class Player {
  private sprite: GameObjects.Sprite;
  private cursors: Types.Input.Keyboard.CursorKeys;
  private wasd: Record<"down" | "up" | "left" | "right", Input.Keyboard.Key>;
  private facing: Direction = "ned";

  constructor(
    scene: Scene,
    x: number,
    y: number,
    private grid: TileValue[][],
  ) {
    this.sprite = scene.add.sprite(x, y, "player", FRAME_BY_DIRECTION.ned);
    this.sprite.setDepth(5);

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey("W"),
      down: keyboard.addKey("S"),
      left: keyboard.addKey("A"),
      right: keyboard.addKey("D"),
    };
  }

  /** Ruta spilleren står i nå. Scenen bruker den til å oppdage trapper. */
  get tileX(): number {
    return Math.floor(this.sprite.x / TILE_SIZE);
  }

  get tileY(): number {
    return Math.floor(this.sprite.y / TILE_SIZE);
  }

  /** Byttes når spilleren skifter etasje — ellers kolliderer den mot forrige plan. */
  setGrid(grid: TileValue[][]) {
    this.grid = grid;
  }

  moveTo(x: number, y: number) {
    this.sprite.setPosition(x, y);
  }

  private isWalkableAt(px: number, py: number): boolean {
    const tileX = Math.floor(px / TILE_SIZE);
    const tileY = Math.floor(py / TILE_SIZE);
    const row = this.grid[tileY];
    if (!row) return false;
    return isWalkable(row[tileX]);
  }

  /** Sjekker alle fire hjørnene av spriten dersom den sto med senter i (x, y). */
  private canMoveTo(x: number, y: number): boolean {
    const half = TILE_SIZE / 2 - 1;
    return (
      this.isWalkableAt(x - half, y - half) &&
      this.isWalkableAt(x + half, y - half) &&
      this.isWalkableAt(x - half, y + half) &&
      this.isWalkableAt(x + half, y + half)
    );
  }

  update(deltaMs: number) {
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    let dx = 0;
    let dy = 0;
    if (left) dx -= 1;
    if (right) dx += 1;
    if (up) dy -= 1;
    if (down) dy += 1;

    if (dx === 0 && dy === 0) return;

    // Normaliser så diagonal bevegelse ikke blir raskere enn rett fram.
    const length = Math.hypot(dx, dy);
    const distance = (SPEED * deltaMs) / 1000;
    const moveX = (dx / length) * distance;
    const moveY = (dy / length) * distance;

    // X og Y sjekkes hver for seg, så figuren glir langs en vegg
    // i stedet for å stoppe helt opp når den går inn i den på skrå.
    const nextX = this.sprite.x + moveX;
    if (this.canMoveTo(nextX, this.sprite.y)) {
      this.sprite.x = nextX;
    }

    const nextY = this.sprite.y + moveY;
    if (this.canMoveTo(this.sprite.x, nextY)) {
      this.sprite.y = nextY;
    }

    this.facing = left ? "venstre" : right ? "hoyre" : up ? "opp" : "ned";
    this.sprite.setFrame(FRAME_BY_DIRECTION[this.facing]);
  }
}
