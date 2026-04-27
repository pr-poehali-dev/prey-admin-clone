export interface Vec2 { x: number; y: number; }

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  hunger: number;
  thirst: number;
  stamina: number;
  inventory: InventoryItem[];
  equippedWeapon: string | null;
  facing: "up" | "down" | "left" | "right";
  attackCooldown: number;
  name: string;
  kills: number;
  alive: boolean;
}

export interface Zombie {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  state: "idle" | "patrol" | "chase" | "attack";
  targetX: number;
  targetY: number;
  attackCooldown: number;
  type: "normal" | "fast" | "big";
  angle: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  life: number;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  life: number;
}

export interface GameState {
  player: Player;
  zombies: Zombie[];
  bullets: Bullet[];
  damageNumbers: DamageNumber[];
  dayTime: number;
  isDay: boolean;
  score: number;
  wave: number;
  paused: boolean;
  gameOver: boolean;
  showInventory: boolean;
  showCraft: boolean;
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
  cameraX: number;
  cameraY: number;
}
