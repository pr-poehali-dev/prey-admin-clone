import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Item {
  id: number; name: string; category: string; rarity: string;
  description: string; damage: number; defense: number; is_active: boolean; created_at: string;
}

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const CATEGORIES = ["weapon", "armor", "consumable", "equipment", "misc"];
const RARITY_COLORS: Record<string, { bg: string; color: string }> = {
  common: { bg: "#eee", color: "#555" },
  uncommon: { bg: "#d0f0d0", color: "#256b25" },
  rare: { bg: "#d0e0ff", color: "#1a3a9a" },
  epic: { bg: "#e8d0ff", color: "#6a1a9a" },
  legendary: { bg: "#ffe8c0", color: "#9a5a00" },
};

const emptyItem: Partial<Item> = { name: "", category: "weapon", rarity: "common", description: "", damage: 0, defense: 0 };

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState<Partial<Item>>(emptyItem);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (category) params.category = category;
    api.items.list(params).then(data => { setItems(data.items || []); setLoading(false); });
  }

  useEffect(() => { load(); }, [category]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); load(); }

  async function handleSave() {
    if (editing) {
      await api.items.update({ ...form, id: editing.id });
      setMsg(`Предмет ${form.name} обновлён`);
    } else {
      await api.items.create(form);
      setMsg(`Предмет ${form.name} создан`);
    }
    setShowForm(false); setEditing(null); setForm(emptyItem); load();
  }

  async function handleToggleActive(item: Item) {
    await api.items.update({ id: item.id, is_active: !item.is_active });
    setMsg(`Предмет ${item.name}: ${!item.is_active ? "активирован" : "деактивирован"}`);
    load();
  }

  function openEdit(item: Item) { setEditing(item); setForm({ ...item }); setShowForm(true); }
  function openCreate() { setEditing(null); setForm(emptyItem); setShowForm(true); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ color: "#48802c", fontSize: "1.3em", borderBottom: "1px solid #ccc", paddingBottom: 6, margin: 0, flex: 1 }}>
          Предметы <span style={{ fontSize: "0.7em", color: "#888" }}>({items.length})</span>
        </h1>
        <button onClick={openCreate} style={btnGreen}>+ Добавить предмет</button>
      </div>

      {msg && <div style={{ padding: "6px 12px", background: "#E1F2B6", border: "1px solid #90ee90", color: "#225500", marginBottom: 12, fontSize: 13 }}>{msg}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 6 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию..."
            style={{ padding: "5px 10px", border: "1px solid #ccc", fontSize: 13, width: 200 }} />
          <button type="submit" style={btnGreen}>Найти</button>
        </form>
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: "5px 8px", border: "1px solid #ccc", fontSize: 13 }}>
          <option value="">Все категории</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <div style={{ color: "#888" }}>Загрузка...</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#efefef" }}>
                <th style={th}>ID</th>
                <th style={th}>Название</th>
                <th style={th}>Категория</th>
                <th style={th}>Редкость</th>
                <th style={th}>Урон</th>
                <th style={th}>Защита</th>
                <th style={th}>Описание</th>
                <th style={th}>Статус</th>
                <th style={th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const rc = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #eee", background: !item.is_active ? "#f9f9f9" : i % 2 === 0 ? "#f7f7f7" : "#fff", opacity: item.is_active ? 1 : 0.7 }}>
                    <td style={td}>{item.id}</td>
                    <td style={{ ...td, fontWeight: "bold" }}>{item.name}</td>
                    <td style={td}>{item.category}</td>
                    <td style={td}>
                      <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 8, fontSize: 11, background: rc.bg, color: rc.color, fontWeight: "bold" }}>
                        {item.rarity}
                      </span>
                    </td>
                    <td style={td}>{item.damage > 0 ? item.damage : "—"}</td>
                    <td style={td}>{item.defense > 0 ? item.defense : "—"}</td>
                    <td style={td}>{item.description || "—"}</td>
                    <td style={td}>
                      <span style={{ fontSize: 11, color: item.is_active ? "#48802c" : "#999" }}>
                        {item.is_active ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openEdit(item)} style={btnSmallGreen}>Изменить</button>
                        <button onClick={() => handleToggleActive(item)} style={item.is_active ? btnSmallRed : btnSmallOrange}>
                          {item.is_active ? "Выключить" : "Включить"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div style={modal}>
          <div style={modalBox}>
            <h3 style={{ color: "#48802c", marginTop: 0 }}>{editing ? `Редактировать: ${editing.name}` : "Новый предмет"}</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Название</label>
              <input type="text" value={form.name ?? ""} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Категория</label>
              <select value={form.category ?? "weapon"} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Редкость</label>
              <select value={form.rarity ?? "common"} onChange={e => setForm({ ...form, rarity: e.target.value })} style={inp}>
                {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Урон</label>
              <input type="number" value={form.damage ?? 0} onChange={e => setForm({ ...form, damage: Number(e.target.value) })} style={inp} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Защита</label>
              <input type="number" value={form.defense ?? 0} onChange={e => setForm({ ...form, defense: Number(e.target.value) })} style={inp} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Описание</label>
              <textarea value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ ...inp, height: 60, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={handleSave} style={btnGreen}>Сохранить</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={btnGray}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 10px", textAlign: "left", color: "#555", fontSize: 12, borderBottom: "1px solid #ddd" };
const td: React.CSSProperties = { padding: "6px 10px", fontSize: 13 };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, color: "#666", marginBottom: 3 };
const inp: React.CSSProperties = { padding: "5px 8px", border: "1px solid #ccc", width: "100%", fontSize: 13, boxSizing: "border-box" };
const btnGreen: React.CSSProperties = { background: "#7da987", color: "#fff", border: "none", padding: "5px 14px", cursor: "pointer", borderRadius: 3, fontSize: 13 };
const btnGray: React.CSSProperties = { background: "#999", color: "#fff", border: "none", padding: "5px 14px", cursor: "pointer", borderRadius: 3, fontSize: 13 };
const btnSmallGreen: React.CSSProperties = { background: "#7da987", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer", borderRadius: 3, fontSize: 11 };
const btnSmallRed: React.CSSProperties = { background: "#e06060", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer", borderRadius: 3, fontSize: 11 };
const btnSmallOrange: React.CSSProperties = { background: "#e09030", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer", borderRadius: 3, fontSize: 11 };
const modal: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalBox: React.CSSProperties = { background: "#fff", padding: 24, borderRadius: 4, minWidth: 360, maxWidth: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" };
