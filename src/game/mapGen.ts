import { TILE, MAP_WIDTH, MAP_HEIGHT } from "./constants";

export interface MapData {
  tiles: number[][];
  resources: Resource[];
  spawnPoints: { x: number; y: number }[];
}

export interface Resource {
  id: string;
  x: number;
  y: number;
  type: "wood" | "stone" | "food" | "water_bottle";
  collected: boolean;
}

function noise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.3) * 43758.5453;
  return n - Math.floor(n);
}

export function generateMap(seed = 42): MapData {
  const tiles: number[][] = [];
  const resources: Resource[] = [];
  const spawnPoints: { x: number; y: number }[] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const n = noise(x, y, seed);
      const n2 = noise(x * 0.5, y * 0.5, seed + 1);
      if (n < 0.08) tiles[y][x] = TILE.WATER;
      else if (n < 0.15) tiles[y][x] = TILE.SAND;
      else if (n2 < 0.18) tiles[y][x] = TILE.DIRT;
      else tiles[y][x] = TILE.GRASS;
    }
  }

  // Roads
  for (let x = 0; x < MAP_WIDTH; x++) {
    tiles[20][x] = TILE.ROAD;
    tiles[21][x] = TILE.ROAD;
    tiles[55][x] = TILE.ROAD;
    tiles[56][x] = TILE.ROAD;
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y][20] = TILE.ROAD;
    tiles[y][21] = TILE.ROAD;
    tiles[y][55] = TILE.ROAD;
    tiles[y][56] = TILE.ROAD;
  }

  // Buildings
  const buildings = [
    { bx: 5, by: 5, bw: 8, bh: 6 },
    { bx: 30, by: 8, bw: 10, bh: 7 },
    { bx: 60, by: 5, bw: 7, bh: 5 },
    { bx: 5, by: 30, bw: 9, bh: 8 },
    { bx: 35, by: 30, bw: 12, bh: 9 },
    { bx: 62, by: 30, bw: 8, bh: 6 },
    { bx: 10, by: 60, bw: 7, bh: 6 },
    { bx: 40, by: 60, bw: 10, bh: 8 },
    { bx: 63, by: 62, bw: 9, bh: 7 },
  ];

  buildings.forEach(({ bx, by, bw, bh }) => {
    for (let y = by; y < by + bh; y++) {
      for (let x = bx; x < bx + bw; x++) {
        if (y === by || y === by + bh - 1 || x === bx || x === bx + bw - 1) {
          tiles[y][x] = TILE.WALL;
        } else {
          tiles[y][x] = TILE.BUILDING_FLOOR;
        }
      }
    }
    const doorY = by + Math.floor(bh / 2);
    tiles[doorY][bx] = TILE.BUILDING_FLOOR;
    tiles[doorY][bx + bw - 1] = TILE.BUILDING_FLOOR;
    spawnPoints.push({ x: (bx + Math.floor(bw / 2)) * 48, y: (by + Math.floor(bh / 2)) * 48 });
  });

  // Trees
  for (let i = 0; i < 200; i++) {
    const tx = Math.floor(noise(i, 0, seed + 5) * MAP_WIDTH);
    const ty = Math.floor(noise(0, i, seed + 6) * MAP_HEIGHT);
    if (tiles[ty] && tiles[ty][tx] === TILE.GRASS) {
      tiles[ty][tx] = TILE.TREE;
    }
  }

  // Resources
  let rid = 0;
  for (let i = 0; i < 60; i++) {
    const rx = Math.floor(noise(i * 3, 1, seed + 7) * MAP_WIDTH);
    const ry = Math.floor(noise(1, i * 3, seed + 8) * MAP_HEIGHT);
    if (tiles[ry]?.[rx] === TILE.GRASS || tiles[ry]?.[rx] === TILE.DIRT) {
      resources.push({ id: `r${rid++}`, x: rx * 48 + 24, y: ry * 48 + 24, type: "wood", collected: false });
    }
  }
  for (let i = 0; i < 40; i++) {
    const rx = Math.floor(noise(i * 5, 2, seed + 9) * MAP_WIDTH);
    const ry = Math.floor(noise(2, i * 5, seed + 10) * MAP_HEIGHT);
    if (tiles[ry]?.[rx] === TILE.DIRT || tiles[ry]?.[rx] === TILE.SAND) {
      resources.push({ id: `r${rid++}`, x: rx * 48 + 24, y: ry * 48 + 24, type: "stone", collected: false });
    }
  }
  for (let i = 0; i < 30; i++) {
    const rx = Math.floor(noise(i * 7, 3, seed + 11) * MAP_WIDTH);
    const ry = Math.floor(noise(3, i * 7, seed + 12) * MAP_HEIGHT);
    if (tiles[ry]?.[rx] === TILE.BUILDING_FLOOR) {
      resources.push({ id: `r${rid++}`, x: rx * 48 + 24, y: ry * 48 + 24, type: "food", collected: false });
    }
  }

  return { tiles, resources, spawnPoints };
}
