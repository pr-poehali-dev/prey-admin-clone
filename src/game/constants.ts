export const TILE_SIZE = 48;
export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 80;
export const PLAYER_SPEED = 3;
export const ZOMBIE_SPEED = 1.2;
export const ZOMBIE_FAST_SPEED = 2.2;
export const ZOMBIE_DETECT_RANGE = 220;
export const ZOMBIE_ATTACK_RANGE = 36;
export const ZOMBIE_ATTACK_DAMAGE = 10;
export const ZOMBIE_ATTACK_COOLDOWN = 1200;
export const BULLET_SPEED = 10;
export const DAY_DURATION = 60000;

export const TILE = {
  GRASS: 0,
  DIRT: 1,
  WATER: 2,
  ROAD: 3,
  WALL: 4,
  TREE: 5,
  BUILDING_FLOOR: 6,
  SAND: 7,
  FENCE: 8,
};

export const TILE_COLORS: Record<number, string> = {
  0: "#4a7c3f",
  1: "#8b6914",
  2: "#2a6db5",
  3: "#555555",
  4: "#4a3728",
  5: "#2d5a1b",
  6: "#c8b89a",
  7: "#c8a84b",
  8: "#8b7355",
};

export const ITEMS = {
  WOOD: { id: "wood", name: "Дерево", color: "#8b4513", emoji: "🪵" },
  STONE: { id: "stone", name: "Камень", color: "#888", emoji: "🪨" },
  FOOD: { id: "food", name: "Еда", color: "#e67e22", emoji: "🥫" },
  WATER_BOTTLE: { id: "water_bottle", name: "Вода", color: "#3498db", emoji: "💧" },
  MEDKIT: { id: "medkit", name: "Аптечка", color: "#e74c3c", emoji: "🩺" },
  BANDAGE: { id: "bandage", name: "Бинт", color: "#ecf0f1", emoji: "🩹" },
  PISTOL: { id: "pistol", name: "Пистолет", color: "#555", emoji: "🔫" },
  RIFLE: { id: "rifle", name: "Винтовка", color: "#333", emoji: "🎯" },
  AMMO: { id: "ammo", name: "Патроны", color: "#f39c12", emoji: "🔶" },
  KNIFE: { id: "knife", name: "Нож", color: "#aaa", emoji: "🔪" },
};

export const CRAFT_RECIPES = [
  { result: "bandage", count: 1, ingredients: [{ id: "wood", count: 2 }], name: "Бинт" },
  { result: "medkit", count: 1, ingredients: [{ id: "bandage", count: 3 }, { id: "food", count: 1 }], name: "Аптечка" },
  { result: "knife", count: 1, ingredients: [{ id: "wood", count: 3 }, { id: "stone", count: 2 }], name: "Нож" },
];
