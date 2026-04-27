import { TILE_SIZE, TILE_COLORS, TILE } from "./constants";
import { GameState, Zombie, Bullet, DamageNumber } from "./types";
import { MapData } from "./mapGen";

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: MapData,
  canvas: HTMLCanvasElement
) {
  const { cameraX, cameraY, player, zombies, bullets, damageNumbers, isDay, dayTime } = state;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Sky overlay
  const dayProgress = dayTime / 60000;
  const darkness = isDay ? 0 : Math.min(0.7, (1 - dayProgress) * 0.8);
  ctx.fillStyle = `rgba(0,0,10,${darkness})`;

  // Draw tiles
  const startTileX = Math.max(0, Math.floor(cameraX / TILE_SIZE));
  const startTileY = Math.max(0, Math.floor(cameraY / TILE_SIZE));
  const endTileX = Math.min(map.tiles[0]?.length || 0, startTileX + Math.ceil(W / TILE_SIZE) + 2);
  const endTileY = Math.min(map.tiles.length, startTileY + Math.ceil(H / TILE_SIZE) + 2);

  for (let ty = startTileY; ty < endTileY; ty++) {
    for (let tx = startTileX; tx < endTileX; tx++) {
      const tile = map.tiles[ty]?.[tx] ?? 0;
      const sx = tx * TILE_SIZE - cameraX;
      const sy = ty * TILE_SIZE - cameraY;

      ctx.fillStyle = TILE_COLORS[tile] || "#4a7c3f";
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

      // Tile details
      if (tile === TILE.TREE) {
        ctx.fillStyle = "#1a3d0a";
        ctx.beginPath();
        ctx.arc(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2d5a1b";
        ctx.beginPath();
        ctx.arc(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2 - 4, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === TILE.WALL) {
        ctx.fillStyle = "#3a2818";
        ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeStyle = "#2a1808";
        ctx.strokeRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (tile === TILE.WATER) {
        ctx.fillStyle = `rgba(40,100,180,${0.3 + Math.sin(Date.now() / 1000 + tx + ty) * 0.1})`;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      } else if (tile === TILE.ROAD) {
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Resources
  map.resources.forEach(r => {
    if (r.collected) return;
    const sx = r.x - cameraX;
    const sy = r.y - cameraY;
    if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) return;

    ctx.font = "20px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const emojis: Record<string, string> = { wood: "🪵", stone: "🪨", food: "🥫", water_bottle: "💧" };
    ctx.fillText(emojis[r.type] || "?", sx, sy);
  });

  // Bullets
  bullets.forEach((b: Bullet) => {
    const sx = b.x - cameraX;
    const sy = b.y - cameraY;
    ctx.fillStyle = b.fromPlayer ? "#ffe066" : "#ff4444";
    ctx.beginPath();
    ctx.arc(sx, sy, b.fromPlayer ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = b.fromPlayer ? "rgba(255,220,100,0.4)" : "rgba(255,80,80,0.3)";
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // Zombies
  zombies.forEach((z: Zombie) => {
    const sx = z.x - cameraX;
    const sy = z.y - cameraY;
    if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) return;
    drawZombie(ctx, z, sx, sy);
  });

  // Player
  drawPlayer(ctx, player, W / 2, H / 2);

  // Night overlay
  if (!isDay || darkness > 0) {
    ctx.fillStyle = `rgba(0,0,20,${darkness})`;
    ctx.fillRect(0, 0, W, H);
    if (!isDay) {
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 180);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Damage numbers
  damageNumbers.forEach((dn: DamageNumber) => {
    const sx = dn.x - cameraX;
    const sy = dn.y - cameraY;
    const alpha = Math.min(1, dn.life / 40);
    ctx.globalAlpha = alpha;
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = dn.color;
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeText(`-${dn.value}`, sx, sy);
    ctx.fillText(`-${dn.value}`, sx, sy);
    ctx.globalAlpha = 1;
  });
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: { x: number; y: number; hp: number; maxHp: number; facing: string; equippedWeapon: string | null }, sx: number, sy: number) {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(sx, sy + 18, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(sx - 12, sy - 14, 24, 28);

  // Head
  ctx.fillStyle = "#FFCC80";
  ctx.beginPath();
  ctx.arc(sx, sy - 18, 11, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#333";
  const eyeOffsets = player.facing === "left" ? [[-6, -2], [-2, -2]] :
    player.facing === "right" ? [[2, -2], [6, -2]] :
    player.facing === "up" ? [[-4, -4], [4, -4]] : [[-4, -1], [4, -1]];
  eyeOffsets.forEach(([ex, ey]) => {
    ctx.beginPath();
    ctx.arc(sx + ex, sy - 18 + ey, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Weapon
  if (player.equippedWeapon === "pistol" || player.equippedWeapon === "rifle") {
    ctx.fillStyle = "#555";
    ctx.fillRect(sx + 10, sy - 8, player.equippedWeapon === "rifle" ? 22 : 14, 5);
  } else if (player.equippedWeapon === "knife") {
    ctx.fillStyle = "#aaa";
    ctx.fillRect(sx + 10, sy - 6, 14, 4);
  }

  // HP bar
  const barW = 36;
  ctx.fillStyle = "#333";
  ctx.fillRect(sx - barW / 2, sy - 34, barW, 5);
  ctx.fillStyle = player.hp > 50 ? "#4CAF50" : player.hp > 25 ? "#FFC107" : "#f44336";
  ctx.fillRect(sx - barW / 2, sy - 34, barW * (player.hp / player.maxHp), 5);
}

function drawZombie(ctx: CanvasRenderingContext2D, z: Zombie, sx: number, sy: number) {
  const colors = {
    normal: { body: "#5a9e52", skin: "#8bc34a" },
    fast: { body: "#9e5252", skin: "#e57373" },
    big: { body: "#52529e", skin: "#9575cd" },
  };
  const c = colors[z.type] || colors.normal;
  const scale = z.type === "big" ? 1.4 : 1;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(scale, scale);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 16, 12 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = c.body;
  ctx.fillRect(-10, -12, 20, 26);

  // Head
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(0, -16, 10, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (glowing red)
  ctx.fillStyle = z.state === "chase" || z.state === "attack" ? "#ff1744" : "#ff6d00";
  [[-3.5, -1], [3.5, -1]].forEach(([ex, ey]) => {
    ctx.beginPath();
    ctx.arc(ex, ey - 15, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();

  // HP bar
  const barW = 32 * (z.type === "big" ? 1.4 : 1);
  ctx.fillStyle = "#333";
  ctx.fillRect(sx - barW / 2, sy - 38, barW, 4);
  ctx.fillStyle = "#f44336";
  ctx.fillRect(sx - barW / 2, sy - 38, barW * (z.hp / z.maxHp), 4);
}
