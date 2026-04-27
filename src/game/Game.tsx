import { useEffect, useRef, useState, useCallback } from "react";
import { GameState, Player } from "./types";
import { generateMap, MapData } from "./mapGen";
import { render } from "./renderer";
import { updateGame, shootBullet, spawnZombies } from "./gameLoop";
import { CRAFT_RECIPES, ITEMS, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from "./constants";

const INITIAL_PLAYER: Player = {
  x: MAP_WIDTH / 2 * TILE_SIZE,
  y: MAP_HEIGHT / 2 * TILE_SIZE,
  vx: 0, vy: 0,
  hp: 100, maxHp: 100,
  hunger: 100, thirst: 100, stamina: 100,
  inventory: [
    { id: "pistol", name: "Пистолет", emoji: "🔫", count: 1 },
    { id: "ammo", name: "Патроны", emoji: "🔶", count: 20 },
    { id: "food", name: "Еда", emoji: "🥫", count: 3 },
    { id: "water_bottle", name: "Вода", emoji: "💧", count: 3 },
    { id: "bandage", name: "Бинт", emoji: "🩹", count: 2 },
  ],
  equippedWeapon: "pistol",
  facing: "down",
  attackCooldown: 0,
  name: "Выживший",
  kills: 0,
  alive: true,
};

function createInitialState(): GameState {
  return {
    player: { ...INITIAL_PLAYER, inventory: INITIAL_PLAYER.inventory.map(i => ({ ...i })) },
    zombies: [],
    bullets: [],
    damageNumbers: [],
    dayTime: 0,
    isDay: true,
    score: 0,
    wave: 0,
    paused: false,
    gameOver: false,
    showInventory: false,
    showCraft: false,
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    cameraX: 0,
    cameraY: 0,
  };
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const mapRef = useRef<MapData>(generateMap(Math.floor(Math.random() * 9999)));
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [ui, setUi] = useState({ hp: 100, hunger: 100, thirst: 100, score: 0, wave: 1, kills: 0, isDay: true, showInv: false, showCraft: false, gameOver: false, ammo: 20 });

  const getCanvas = () => canvasRef.current;

  const gameLoop = useCallback((time: number) => {
    const dt = Math.min(time - lastTimeRef.current, 50);
    lastTimeRef.current = time;
    const canvas = getCanvas();
    if (!canvas) { animRef.current = requestAnimationFrame(gameLoop); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) { animRef.current = requestAnimationFrame(gameLoop); return; }

    stateRef.current = updateGame(stateRef.current, mapRef.current, dt, canvas.width, canvas.height);
    render(ctx, stateRef.current, mapRef.current, canvas);

    const p = stateRef.current.player;
    const ammo = p.inventory.find(i => i.id === "ammo")?.count ?? 0;
    setUi({
      hp: Math.round(p.hp), hunger: Math.round(p.hunger), thirst: Math.round(p.thirst),
      score: stateRef.current.score, wave: stateRef.current.wave,
      kills: p.kills, isDay: stateRef.current.isDay,
      showInv: stateRef.current.showInventory, showCraft: stateRef.current.showCraft,
      gameOver: stateRef.current.gameOver, ammo,
    });

    animRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    // Spawn first wave
    const canvas = canvasRef.current;
    if (canvas) spawnZombies(stateRef.current, mapRef.current, canvas.width, canvas.height);

    const onKey = (e: KeyboardEvent, down: boolean) => {
      e.preventDefault();
      const s = stateRef.current;
      if (down) {
        s.keys.add(e.code);
        if (e.code === "KeyI") s.showInventory = !s.showInventory;
        if (e.code === "KeyC") s.showCraft = !s.showCraft;
        if (e.code === "KeyE") {
          // Use item
          const p = s.player;
          const food = p.inventory.find(i => i.id === "food" && i.count > 0);
          const water = p.inventory.find(i => i.id === "water_bottle" && i.count > 0);
          const medkit = p.inventory.find(i => i.id === "medkit" && i.count > 0);
          const bandage = p.inventory.find(i => i.id === "bandage" && i.count > 0);
          if (medkit) {
            p.hp = Math.min(p.maxHp, p.hp + 50);
            medkit.count--;
          } else if (bandage) {
            p.hp = Math.min(p.maxHp, p.hp + 20);
            bandage.count--;
          } else if (food) {
            p.hunger = Math.min(100, p.hunger + 30);
            food.count--;
          } else if (water) {
            p.thirst = Math.min(100, p.thirst + 35);
            water.count--;
          }
          p.inventory = p.inventory.filter(i => i.count > 0);
        }
        if (e.code === "Digit1") s.player.equippedWeapon = "pistol";
        if (e.code === "Digit2") s.player.equippedWeapon = "rifle";
        if (e.code === "Digit3") s.player.equippedWeapon = "knife";
        if (e.code === "KeyR" && s.gameOver) {
          stateRef.current = createInitialState();
          mapRef.current = generateMap(Math.floor(Math.random() * 9999));
          spawnZombies(stateRef.current, mapRef.current, canvas?.width ?? 800, canvas?.height ?? 600);
        }
        if (e.code === "Escape") s.paused = !s.paused;
      } else {
        s.keys.delete(e.code);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) { stateRef.current.mouseX = e.clientX - rect.left; stateRef.current.mouseY = e.clientY - rect.top; }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      stateRef.current = shootBullet(stateRef.current, stateRef.current.mouseX, stateRef.current.mouseY);
    };

    const onResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };

    window.addEventListener("keydown", e => onKey(e, true));
    window.addEventListener("keyup", e => onKey(e, false));
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseDown);
    window.addEventListener("resize", onResize);
    onResize();

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("keydown", e => onKey(e, true));
      window.removeEventListener("keyup", e => onKey(e, false));
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseDown);
      window.removeEventListener("resize", onResize);
    };
  }, [gameLoop]);

  function craft(recipeIdx: number) {
    const recipe = CRAFT_RECIPES[recipeIdx];
    const p = stateRef.current.player;
    const inv = [...p.inventory];
    for (const ing of recipe.ingredients) {
      const item = inv.find(i => i.id === ing.id);
      if (!item || item.count < ing.count) return;
    }
    for (const ing of recipe.ingredients) {
      const item = inv.find(i => i.id === ing.id);
      if (item) item.count -= ing.count;
    }
    const resultDef = ITEMS[recipe.result as keyof typeof ITEMS];
    const existing = inv.find(i => i.id === recipe.result);
    if (existing) existing.count += recipe.count;
    else if (resultDef) inv.push({ id: recipe.result, name: resultDef.name, emoji: resultDef.emoji, count: recipe.count });
    stateRef.current.player.inventory = inv.filter(i => i.count > 0);
  }

  const statBar = (val: number, color: string, icon: string, label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 120 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.4)", borderRadius: 3, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${val}%`, background: color, height: "100%", transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, color: "#fff", minWidth: 28, textAlign: "right" }}>{val}</span>
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#000", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%", cursor: "crosshair" }} />

      {/* HUD */}
      <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.7)", padding: "10px 14px", borderRadius: 6, color: "#fff", minWidth: 200 }}>
        {statBar(ui.hp, ui.hp > 50 ? "#4CAF50" : ui.hp > 25 ? "#FFC107" : "#f44336", "❤️", "HP")}
        <div style={{ marginTop: 4 }}>{statBar(ui.hunger, "#e67e22", "🍖", "Голод")}</div>
        <div style={{ marginTop: 4 }}>{statBar(ui.thirst, "#3498db", "💧", "Жажда")}</div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#aaa" }}>
          🔶 Патроны: <b style={{ color: "#fff" }}>{ui.ammo}</b>
          &nbsp;&nbsp;💀 Убийств: <b style={{ color: "#e74c3c" }}>{ui.kills}</b>
        </div>
      </div>

      {/* Top right */}
      <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.7)", padding: "8px 14px", borderRadius: 6, color: "#fff", textAlign: "right" }}>
        <div style={{ fontSize: 13 }}>{ui.isDay ? "☀️ День" : "🌙 Ночь"}</div>
        <div style={{ fontSize: 13, marginTop: 2 }}>🌊 Волна <b>{ui.wave}</b></div>
        <div style={{ fontSize: 13, marginTop: 2 }}>⭐ Счёт: <b>{ui.score}</b></div>
      </div>

      {/* Controls hint */}
      <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: 6, color: "#ccc", fontSize: 11, lineHeight: 1.6 }}>
        WASD — движение &nbsp; ЛКМ — стрелять/атаковать<br />
        E — использовать предмет &nbsp; I — инвентарь &nbsp; C — крафт<br />
        1-Пистолет &nbsp; 2-Винтовка &nbsp; 3-Нож &nbsp; ESC — пауза
      </div>

      {/* Inventory */}
      {ui.showInv && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(20,30,20,0.97)", border: "2px solid #4CAF50", borderRadius: 8, padding: 20, color: "#fff", minWidth: 320, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <b style={{ fontSize: 16, color: "#4CAF50" }}>🎒 Инвентарь</b>
            <button onClick={() => { stateRef.current.showInventory = false; }} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
          {stateRef.current.player.inventory.length === 0
            ? <div style={{ color: "#888", fontSize: 13 }}>Инвентарь пуст</div>
            : stateRef.current.player.inventory.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #333" }}>
                <span style={{ fontSize: 22 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Количество: {item.count}</div>
                </div>
                {["food","water_bottle","medkit","bandage"].includes(item.id) && (
                  <button onClick={() => {
                    const p = stateRef.current.player;
                    const it = p.inventory.find(i => i.id === item.id);
                    if (!it || it.count <= 0) return;
                    if (item.id === "food") p.hunger = Math.min(100, p.hunger + 30);
                    if (item.id === "water_bottle") p.thirst = Math.min(100, p.thirst + 35);
                    if (item.id === "medkit") p.hp = Math.min(p.maxHp, p.hp + 50);
                    if (item.id === "bandage") p.hp = Math.min(p.maxHp, p.hp + 20);
                    it.count--;
                    p.inventory = p.inventory.filter(i => i.count > 0);
                  }} style={{ background: "#4CAF50", color: "#fff", border: "none", padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                    Использовать
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Craft */}
      {ui.showCraft && (
        <div style={{ position: "absolute", top: "50%", right: 20, transform: "translateY(-50%)", background: "rgba(20,30,20,0.97)", border: "2px solid #FF9800", borderRadius: 8, padding: 20, color: "#fff", minWidth: 280, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <b style={{ fontSize: 16, color: "#FF9800" }}>⚒️ Крафт</b>
            <button onClick={() => { stateRef.current.showCraft = false; }} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
          {CRAFT_RECIPES.map((r, i) => {
            const inv = stateRef.current.player.inventory;
            const canCraft = r.ingredients.every(ing => (inv.find(it => it.id === ing.id)?.count ?? 0) >= ing.count);
            return (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #333" }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
                  Нужно: {r.ingredients.map(ing => `${ing.id} x${ing.count}`).join(", ")}
                </div>
                <button
                  onClick={() => craft(i)}
                  disabled={!canCraft}
                  style={{ background: canCraft ? "#FF9800" : "#555", color: "#fff", border: "none", padding: "4px 14px", borderRadius: 4, cursor: canCraft ? "pointer" : "not-allowed", fontSize: 12 }}
                >
                  Создать
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Game Over */}
      {ui.gameOver && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <div style={{ color: "#f44336", fontSize: 48, fontWeight: "bold", marginBottom: 16 }}>☠️ ВЫ УМЕРЛИ</div>
          <div style={{ color: "#fff", fontSize: 20, marginBottom: 8 }}>Счёт: {ui.score}</div>
          <div style={{ color: "#aaa", fontSize: 16, marginBottom: 8 }}>Убийств: {ui.kills}</div>
          <div style={{ color: "#aaa", fontSize: 16, marginBottom: 32 }}>Волна: {ui.wave}</div>
          <button
            onClick={() => {
              stateRef.current = createInitialState();
              mapRef.current = generateMap(Math.floor(Math.random() * 9999));
              const canvas = canvasRef.current;
              if (canvas) spawnZombies(stateRef.current, mapRef.current, canvas.width, canvas.height);
            }}
            style={{ background: "#4CAF50", color: "#fff", border: "none", padding: "14px 40px", fontSize: 20, borderRadius: 8, cursor: "pointer" }}
          >
            Играть снова
          </button>
          <div style={{ color: "#666", fontSize: 13, marginTop: 12 }}>или нажми R</div>
        </div>
      )}
    </div>
  );
}
