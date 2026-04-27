import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Player {
  id: number; username: string; email: string; level: number;
  experience: number; health: number; gold: number; diamonds: number;
  kills: number; deaths: number; is_banned: boolean; ban_reason: string;
  last_server: string; last_login: string; created_at: string;
}

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [bannedFilter, setBannedFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Player | null>(null);
  const [banReason, setBanReason] = useState("");
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [msg, setMsg] = useState("");

  const limit = 20;

  function load(p = 1) {
    setLoading(true);
    api.players.list({ page: String(p), limit: String(limit), search, banned: bannedFilter })
      .then(data => {
        setPlayers(data.players || []);
        setTotal(data.total || 0);
        setLoading(false);
      });
  }

  useEffect(() => { load(page); }, [page, bannedFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1);
  }

  async function handleBan(player: Player) {
    const reason = prompt(`Причина бана для ${player.username}:`, "Нарушение правил");
    if (!reason) return;
    await api.players.update({ id: player.id, action: "ban", ban_reason: reason });
    setMsg(`Игрок ${player.username} заблокирован`);
    load(page);
  }

  async function handleUnban(player: Player) {
    await api.players.update({ id: player.id, action: "unban" });
    setMsg(`Игрок ${player.username} разблокирован`);
    load(page);
  }

  async function handleSaveEdit() {
    if (!editPlayer) return;
    await api.players.update({
      id: editPlayer.id,
      level: editPlayer.level,
      experience: editPlayer.experience,
      health: editPlayer.health,
      gold: editPlayer.gold,
      diamonds: editPlayer.diamonds,
    });
    setMsg(`Игрок ${editPlayer.username} обновлён`);
    setEditPlayer(null);
    load(page);
  }

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <h1 style={{ color: "#48802c", fontSize: "1.3em", marginBottom: 12, borderBottom: "1px solid #ccc", paddingBottom: 6 }}>
        Игроки <span style={{ fontSize: "0.7em", color: "#888" }}>({total})</span>
      </h1>

      {msg && <div style={{ padding: "6px 12px", background: "#E1F2B6", border: "1px solid #90ee90", color: "#225500", marginBottom: 12, fontSize: 13 }}>{msg}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 6 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по нику или email..."
            style={{ padding: "5px 10px", border: "1px solid #ccc", fontSize: 13, width: 220 }}
          />
          <button type="submit" style={btnGreen}>Найти</button>
        </form>
        <select
          value={bannedFilter}
          onChange={e => { setBannedFilter(e.target.value); setPage(1); }}
          style={{ padding: "5px 8px", border: "1px solid #ccc", fontSize: 13 }}
        >
          <option value="">Все игроки</option>
          <option value="false">Активные</option>
          <option value="true">Заблокированные</option>
        </select>
      </div>

      {loading ? <div style={{ color: "#888" }}>Загрузка...</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#efefef" }}>
                <th style={th}>ID</th>
                <th style={th}>Ник</th>
                <th style={th}>Ур.</th>
                <th style={th}>Здоровье</th>
                <th style={th}>Золото</th>
                <th style={th}>Убийств</th>
                <th style={th}>Смертей</th>
                <th style={th}>Последний сервер</th>
                <th style={th}>Статус</th>
                <th style={th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee", background: p.is_banned ? "#fff8f8" : i % 2 === 0 ? "#f7f7f7" : "#fff" }}>
                  <td style={td}>{p.id}</td>
                  <td style={td}>
                    <button onClick={() => setSelected(p)} style={{ background: "none", border: "none", color: "#48802c", cursor: "pointer", fontWeight: "bold", padding: 0 }}>
                      {p.username}
                    </button>
                  </td>
                  <td style={td}>{p.level}</td>
                  <td style={td}>{p.health}</td>
                  <td style={td}>{p.gold?.toLocaleString()}</td>
                  <td style={td}>{p.kills}</td>
                  <td style={td}>{p.deaths}</td>
                  <td style={td}>{p.last_server || "—"}</td>
                  <td style={td}>
                    {p.is_banned
                      ? <span style={{ color: "#c00", fontWeight: "bold", fontSize: 11 }}>БАН</span>
                      : <span style={{ color: "#48802c", fontSize: 11 }}>Активен</span>}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setEditPlayer({ ...p })} style={btnSmallGreen}>Изменить</button>
                      {p.is_banned
                        ? <button onClick={() => handleUnban(p)} style={btnSmallOrange}>Разбанить</button>
                        : <button onClick={() => handleBan(p)} style={btnSmallRed}>Бан</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: "flex", gap: 4, marginTop: 12, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>Страница:</span>
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              padding: "3px 9px", border: "1px solid #ccc", cursor: "pointer", fontSize: 12,
              background: page === p ? "#7da987" : "#fff", color: page === p ? "#fff" : "#555"
            }}>{p}</button>
          ))}
        </div>
      )}

      {selected && (
        <div style={modal}>
          <div style={modalBox}>
            <h3 style={{ color: "#48802c", marginTop: 0 }}>Игрок: {selected.username}</h3>
            <table style={{ fontSize: 13, width: "100%" }}>
              <tbody>
                {[
                  ["ID", selected.id], ["Email", selected.email || "—"],
                  ["Уровень", selected.level], ["Опыт", selected.experience?.toLocaleString()],
                  ["Здоровье", selected.health], ["Золото", selected.gold?.toLocaleString()],
                  ["Алмазы", selected.diamonds], ["Убийств", selected.kills],
                  ["Смертей", selected.deaths], ["Последний сервер", selected.last_server || "—"],
                  ["Последний вход", selected.last_login ? new Date(selected.last_login).toLocaleString("ru") : "—"],
                  ["Зарегистрирован", selected.created_at ? new Date(selected.created_at).toLocaleString("ru") : "—"],
                  ["Статус", selected.is_banned ? `БАН (${selected.ban_reason})` : "Активен"],
                ].map(([k, v]) => (
                  <tr key={String(k)}>
                    <td style={{ padding: "3px 10px 3px 0", color: "#666", width: "40%", fontWeight: "bold" }}>{k}</td>
                    <td style={{ padding: "3px 0", color: "#333" }}>{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setSelected(null)} style={{ ...btnGreen, marginTop: 12 }}>Закрыть</button>
          </div>
        </div>
      )}

      {editPlayer && (
        <div style={modal}>
          <div style={modalBox}>
            <h3 style={{ color: "#48802c", marginTop: 0 }}>Редактировать: {editPlayer.username}</h3>
            {[
              { label: "Уровень", key: "level" as const },
              { label: "Опыт", key: "experience" as const },
              { label: "Здоровье", key: "health" as const },
              { label: "Золото", key: "gold" as const },
              { label: "Алмазы", key: "diamonds" as const },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 3 }}>{f.label}</label>
                <input
                  type="number"
                  value={editPlayer[f.key]}
                  onChange={e => setEditPlayer({ ...editPlayer, [f.key]: Number(e.target.value) })}
                  style={{ padding: "5px 8px", border: "1px solid #ccc", width: "100%", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={handleSaveEdit} style={btnGreen}>Сохранить</button>
              <button onClick={() => setEditPlayer(null)} style={btnGray}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 10px", textAlign: "left", color: "#555", fontSize: 12, borderBottom: "1px solid #ddd" };
const td: React.CSSProperties = { padding: "6px 10px", fontSize: 13 };
const btnGreen: React.CSSProperties = { background: "#7da987", color: "#fff", border: "none", padding: "5px 14px", cursor: "pointer", borderRadius: 3, fontSize: 13 };
const btnGray: React.CSSProperties = { background: "#999", color: "#fff", border: "none", padding: "5px 14px", cursor: "pointer", borderRadius: 3, fontSize: 13 };
const btnSmallGreen: React.CSSProperties = { background: "#7da987", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer", borderRadius: 3, fontSize: 11 };
const btnSmallRed: React.CSSProperties = { background: "#e06060", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer", borderRadius: 3, fontSize: 11 };
const btnSmallOrange: React.CSSProperties = { background: "#e09030", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer", borderRadius: 3, fontSize: 11 };
const modal: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalBox: React.CSSProperties = { background: "#fff", padding: 24, borderRadius: 4, minWidth: 360, maxWidth: 500, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" };
