import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Server {
  id: number; name: string; host: string; port: number; region: string;
  max_players: number; current_players: number; status: string; map_name: string;
  created_at: string; updated_at: string;
}

const empty: Partial<Server> = { name: "", host: "", port: 7777, region: "EU", max_players: 100, map_name: "" };

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Server>>(empty);
  const [editing, setEditing] = useState<Server | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");

  function load() {
    setLoading(true);
    api.servers.list().then(data => { setServers(data.servers || []); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (editing) {
      await api.servers.update({ ...form, id: editing.id });
      setMsg(`Сервер ${form.name} обновлён`);
    } else {
      await api.servers.create(form);
      setMsg(`Сервер ${form.name} создан`);
    }
    setShowForm(false);
    setEditing(null);
    setForm(empty);
    load();
  }

  async function handleStatusToggle(s: Server) {
    const newStatus = s.status === "online" ? "offline" : "online";
    await api.servers.update({ id: s.id, status: newStatus });
    setMsg(`Сервер ${s.name}: статус изменён на ${newStatus}`);
    load();
  }

  function openEdit(s: Server) {
    setEditing(s);
    setForm({ ...s });
    setShowForm(true);
  }

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ color: "#48802c", fontSize: "1.3em", borderBottom: "1px solid #ccc", paddingBottom: 6, margin: 0, flex: 1 }}>
          Серверы
        </h1>
        <button onClick={openCreate} style={btnGreen}>+ Добавить сервер</button>
      </div>

      {msg && <div style={{ padding: "6px 12px", background: "#E1F2B6", border: "1px solid #90ee90", color: "#225500", marginBottom: 12, fontSize: 13 }}>{msg}</div>}

      {loading ? <div style={{ color: "#888" }}>Загрузка...</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#efefef" }}>
                <th style={th}>Имя</th>
                <th style={th}>Хост</th>
                <th style={th}>Порт</th>
                <th style={th}>Регион</th>
                <th style={th}>Игроки</th>
                <th style={th}>Карта</th>
                <th style={th}>Статус</th>
                <th style={th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#f7f7f7" : "#fff" }}>
                  <td style={{ ...td, fontWeight: "bold" }}>{s.name}</td>
                  <td style={td}>{s.host}</td>
                  <td style={td}>{s.port}</td>
                  <td style={td}>{s.region}</td>
                  <td style={td}>{s.current_players} / {s.max_players}</td>
                  <td style={td}>{s.map_name || "—"}</td>
                  <td style={td}>
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 10, fontSize: 11,
                      background: s.status === "online" ? "#E1F2B6" : "#ffe0e0",
                      color: s.status === "online" ? "#48802c" : "#c00",
                      fontWeight: "bold"
                    }}>
                      {s.status === "online" ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => openEdit(s)} style={btnSmallGreen}>Изменить</button>
                      <button onClick={() => handleStatusToggle(s)} style={s.status === "online" ? btnSmallRed : btnSmallOrange}>
                        {s.status === "online" ? "Выключить" : "Включить"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div style={modal}>
          <div style={modalBox}>
            <h3 style={{ color: "#48802c", marginTop: 0 }}>
              {editing ? `Редактировать: ${editing.name}` : "Новый сервер"}
            </h3>
            {[
              { label: "Название", key: "name", type: "text" },
              { label: "Хост (IP)", key: "host", type: "text" },
              { label: "Порт", key: "port", type: "number" },
              { label: "Регион", key: "region", type: "text" },
              { label: "Макс. игроков", key: "max_players", type: "number" },
              { label: "Карта", key: "map_name", type: "text" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 3 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={String(form[f.key as keyof typeof form] ?? "")}
                  onChange={e => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                  style={{ padding: "5px 8px", border: "1px solid #ccc", width: "100%", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            ))}
            {editing && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 3 }}>Текущие игроки</label>
                <input
                  type="number"
                  value={form.current_players ?? 0}
                  onChange={e => setForm({ ...form, current_players: Number(e.target.value) })}
                  style={{ padding: "5px 8px", border: "1px solid #ccc", width: "100%", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            )}
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
const btnGreen: React.CSSProperties = { background: "#7da987", color: "#fff", border: "none", padding: "5px 14px", cursor: "pointer", borderRadius: 3, fontSize: 13 };
const btnGray: React.CSSProperties = { background: "#999", color: "#fff", border: "none", padding: "5px 14px", cursor: "pointer", borderRadius: 3, fontSize: 13 };
const btnSmallGreen: React.CSSProperties = { background: "#7da987", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer", borderRadius: 3, fontSize: 11 };
const btnSmallRed: React.CSSProperties = { background: "#e06060", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer", borderRadius: 3, fontSize: 11 };
const btnSmallOrange: React.CSSProperties = { background: "#e09030", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer", borderRadius: 3, fontSize: 11 };
const modal: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalBox: React.CSSProperties = { background: "#fff", padding: 24, borderRadius: 4, minWidth: 360, maxWidth: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" };
