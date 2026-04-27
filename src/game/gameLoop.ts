import { GameState, Player, Zombie, Bullet, DamageNumber } from "./types";
import { MapData } from "./mapGen";
import {
  TILE, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  PLAYER_SPEED, ZOMBIE_SPEED, ZOMBIE_FAST_SPEED,
  ZOMBIE_DETECT_RANGE, ZOMBIE_ATTACK_RANGE,
  ZOMBIE_ATTACK_DAMAGE, ZOMBIE_ATTACK_COOLDOWN,
  BULLET_SPEED, DAY_DURATION
} from "./constants";

let bulletIdCounter = 0;
let dmgIdCounter = 0;
let zombieIdCounter = 0;

function isSolid(map: MapData, wx: number, wy: number): boolean {
  const tx = Math.floor(wx / TILE_SIZE);
  const ty = Math.floor(wy / TILE_SIZE);
  if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT) return true;
  const t = map.tiles[ty]?.[tx];
  return t === TILE.WALL || t === TILE.TREE || t === TILE.WATER;
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function spawnZombies(state: GameState, map: MapData, canvasW: number, canvasH: number) {
  const count = 3 + state.wave * 2;
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, tries = 0;
    do {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { x = state.player.x + (Math.random() - 0.5) * canvasW * 1.5; y = state.player.y - canvasH / 2 - 100; }
      else if (edge === 1) { x = state.player.x + (Math.random() - 0.5) * canvasW * 1.5; y = state.player.y + canvasH / 2 + 100; }
      else if (edge === 2) { x = state.player.x - canvasW / 2 - 100; y = state.player.y + (Math.random() - 0.5) * canvasH * 1.5; }
      else { x = state.player.x + canvasW / 2 + 100; y = state.player.y + (Math.random() - 0.5) * canvasH * 1.5; }
      tries++;
    } while (isSolid(map, x, y) && tries < 10);

    x = Math.max(48, Math.min(MAP_WIDTH * TILE_SIZE - 48, x));
    y = Math.max(48, Math.min(MAP_HEIGHT * TILE_SIZE - 48, y));

    const rnd = Math.random();
    const type: Zombie["type"] = rnd < 0.15 ? "big" : rnd < 0.35 ? "fast" : "normal";
    const hp = type === "big" ? 150 : type === "fast" ? 50 : 80;

    state.zombies.push({
      id: `z${zombieIdCounter++}`,
      x, y, hp, maxHp: hp,
      state: "patrol",
      targetX: x + (Math.random() - 0.5) * 200,
      targetY: y + (Math.random() - 0.5) * 200,
      attackCooldown: 0,
      type,
      angle: Math.random() * Math.PI * 2,
    });
  }
}

export function updateGame(state: GameState, map: MapData, dt: number, canvasW: number, canvasH: number): GameState {
  if (state.paused || state.gameOver) return state;

  const s = { ...state };
  const p = { ...s.player };

  // Day/night
  s.dayTime = (s.dayTime + dt) % (DAY_DURATION * 2);
  s.isDay = s.dayTime < DAY_DURATION;

  // Player movement
  let dx = 0, dy = 0;
  if (s.keys.has("KeyW") || s.keys.has("ArrowUp")) dy -= 1;
  if (s.keys.has("KeyS") || s.keys.has("ArrowDown")) dy += 1;
  if (s.keys.has("KeyA") || s.keys.has("ArrowLeft")) dx -= 1;
  if (s.keys.has("KeyD") || s.keys.has("ArrowRight")) dx += 1;

  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  const spd = PLAYER_SPEED * (s.keys.has("ShiftLeft") ? 1.8 : 1);

  if (dx < 0) p.facing = "left";
  else if (dx > 0) p.facing = "right";
  else if (dy < 0) p.facing = "up";
  else if (dy > 0) p.facing = "down";

  const nx = p.x + dx * spd;
  const ny = p.y + dy * spd;

  if (!isSolid(map, nx, p.y)) p.x = Math.max(24, Math.min(MAP_WIDTH * TILE_SIZE - 24, nx));
  if (!isSolid(map, p.x, ny)) p.y = Math.max(24, Math.min(MAP_HEIGHT * TILE_SIZE - 24, ny));

  // Resource collection
  map.resources.forEach(r => {
    if (r.collected) return;
    if (dist(p.x, p.y, r.x, r.y) < 36) {
      r.collected = true;
      const inv = [...p.inventory];
      const existing = inv.find(i => i.id === r.type);
      if (existing) existing.count++;
      else {
        const ITEMS: Record<string, { name: string; emoji: string }> = {
          wood: { name: "Дерево", emoji: "🪵" },
          stone: { name: "Камень", emoji: "🪨" },
          food: { name: "Еда", emoji: "🥫" },
          water_bottle: { name: "Вода", emoji: "💧" },
        };
        const def = ITEMS[r.type];
        if (def) inv.push({ id: r.type, name: def.name, emoji: def.emoji, count: 1 });
      }
      p.inventory = inv;
    }
  });

  // Hunger/thirst
  p.hunger = Math.max(0, p.hunger - dt * 0.003);
  p.thirst = Math.max(0, p.thirst - dt * 0.004);
  if (p.hunger <= 0 || p.thirst <= 0) {
    p.hp = Math.max(0, p.hp - dt * 0.02);
  }
  if (p.hp <= 0) { p.alive = false; s.gameOver = true; }

  // Attack cooldown
  if (p.attackCooldown > 0) p.attackCooldown -= dt;

  // Camera
  s.cameraX = p.x - canvasW / 2;
  s.cameraY = p.y - canvasH / 2;
  s.cameraX = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvasW, s.cameraX));
  s.cameraY = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvasH, s.cameraY));

  // Bullets
  const newBullets: Bullet[] = [];
  const newDmg: DamageNumber[] = [...s.damageNumbers];

  s.bullets.forEach(b => {
    const nb = { ...b };
    nb.x += nb.vx;
    nb.y += nb.vy;
    nb.life -= 1;

    if (nb.life <= 0 || isSolid(map, nb.x, nb.y)) return;

    if (nb.fromPlayer) {
      let hit = false;
      s.zombies = s.zombies.map(z => {
        if (hit) return z;
        if (dist(nb.x, nb.y, z.x, z.y) < 20) {
          hit = true;
          newDmg.push({ id: `d${dmgIdCounter++}`, x: z.x, y: z.y - 20, value: nb.damage, color: "#ff4444", life: 60 });
          return { ...z, hp: z.hp - nb.damage };
        }
        return z;
      });
      if (!hit) newBullets.push(nb);
    } else {
      if (dist(nb.x, nb.y, p.x, p.y) < 18) {
        p.hp = Math.max(0, p.hp - nb.damage);
        newDmg.push({ id: `d${dmgIdCounter++}`, x: p.x, y: p.y - 30, value: nb.damage, color: "#ff8800", life: 60 });
      } else {
        newBullets.push(nb);
      }
    }
  });

  // Remove dead zombies
  const killedCount = s.zombies.filter(z => z.hp <= 0).length;
  s.score += killedCount * 10;
  p.kills += killedCount;
  s.zombies = s.zombies.filter(z => z.hp > 0);

  // Zombie AI
  s.zombies = s.zombies.map(z => {
    const nz = { ...z };
    const d = dist(p.x, p.y, nz.x, nz.y);
    const speed = nz.type === "fast" ? ZOMBIE_FAST_SPEED : ZOMBIE_SPEED;

    if (d < ZOMBIE_DETECT_RANGE) {
      nz.state = d < ZOMBIE_ATTACK_RANGE ? "attack" : "chase";
    } else {
      nz.state = "patrol";
    }

    if (nz.state === "chase" || nz.state === "attack") {
      const angle = Math.atan2(p.y - nz.y, p.x - nz.x);
      if (nz.state === "chase") {
        const znx = nz.x + Math.cos(angle) * speed;
        const zny = nz.y + Math.sin(angle) * speed;
        if (!isSolid(map, znx, nz.y)) nz.x = znx;
        if (!isSolid(map, nz.x, zny)) nz.y = zny;
      }
      if (nz.state === "attack" && nz.attackCooldown <= 0) {
        p.hp = Math.max(0, p.hp - ZOMBIE_ATTACK_DAMAGE);
        newDmg.push({ id: `d${dmgIdCounter++}`, x: p.x, y: p.y - 30, value: ZOMBIE_ATTACK_DAMAGE, color: "#ff0000", life: 60 });
        nz.attackCooldown = ZOMBIE_ATTACK_COOLDOWN;
      }
    } else {
      // Patrol
      const pd = dist(nz.x, nz.y, nz.targetX, nz.targetY);
      if (pd < 10) {
        nz.targetX = nz.x + (Math.random() - 0.5) * 200;
        nz.targetY = nz.y + (Math.random() - 0.5) * 200;
        nz.targetX = Math.max(48, Math.min(MAP_WIDTH * TILE_SIZE - 48, nz.targetX));
        nz.targetY = Math.max(48, Math.min(MAP_HEIGHT * TILE_SIZE - 48, nz.targetY));
      } else {
        const angle = Math.atan2(nz.targetY - nz.y, nz.targetX - nz.x);
        const znx = nz.x + Math.cos(angle) * (speed * 0.5);
        const zny = nz.y + Math.sin(angle) * (speed * 0.5);
        if (!isSolid(map, znx, nz.y)) nz.x = znx;
        if (!isSolid(map, nz.x, zny)) nz.y = zny;
      }
    }

    if (nz.attackCooldown > 0) nz.attackCooldown -= dt;
    return nz;
  });

  // Spawn wave
  if (s.zombies.length === 0) {
    s.wave++;
    spawnZombies(s, map, canvasW, canvasH);
  }

  // Damage numbers decay
  s.damageNumbers = newDmg.map(d => ({ ...d, y: d.y - 0.5, life: d.life - 1 })).filter(d => d.life > 0);

  s.bullets = newBullets;
  s.player = p;
  return s;
}

export function shootBullet(state: GameState, toX: number, toY: number): GameState {
  const p = state.player;
  if (p.attackCooldown > 0) return state;

  const hasPistol = p.inventory.find(i => i.id === "pistol" && i.count > 0);
  const hasRifle = p.inventory.find(i => i.id === "rifle" && i.count > 0);
  const hasAmmo = p.inventory.find(i => i.id === "ammo" && i.count > 0);
  const hasKnife = p.inventory.find(i => i.id === "knife" && i.count > 0);

  let damage = 0;
  let cooldown = 0;

  if (hasRifle && hasAmmo) { damage = 60; cooldown = 400; }
  else if (hasPistol && hasAmmo) { damage = 30; cooldown = 600; }
  else if (hasKnife) {
    damage = 25; cooldown = 500;
    // Knife: instant hit nearby
    const worldX = toX + state.cameraX;
    const worldY = toY + state.cameraY;
    const newState = { ...state, player: { ...p, attackCooldown: cooldown, equippedWeapon: "knife" } };
    newState.zombies = newState.zombies.map(z => {
      if (Math.sqrt((z.x - worldX) ** 2 + (z.y - worldY) ** 2) < 55) {
        newState.damageNumbers = [...newState.damageNumbers, { id: `d${dmgIdCounter++}`, x: z.x, y: z.y - 20, value: damage, color: "#ff4444", life: 60 }];
        return { ...z, hp: z.hp - damage };
      }
      return z;
    });
    newState.score += newState.zombies.filter(z => z.hp <= 0).length * 10;
    newState.player.kills += newState.zombies.filter(z => z.hp <= 0).length;
    newState.zombies = newState.zombies.filter(z => z.hp > 0);
    return newState;
  }

  if (damage === 0) return state;

  // Consume ammo
  const newInv = p.inventory.map(i => i.id === "ammo" ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0);
  const weapon = hasRifle ? "rifle" : "pistol";

  const angle = Math.atan2(toY + state.cameraY - p.y, toX + state.cameraX - p.x);
  const bullet: Bullet = {
    id: `b${bulletIdCounter++}`,
    x: p.x, y: p.y,
    vx: Math.cos(angle) * BULLET_SPEED,
    vy: Math.sin(angle) * BULLET_SPEED,
    damage, fromPlayer: true, life: 80,
  };

  return {
    ...state,
    bullets: [...state.bullets, bullet],
    player: { ...p, attackCooldown: cooldown, inventory: newInv, equippedWeapon: weapon },
  };
}
