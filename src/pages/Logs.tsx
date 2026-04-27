import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Log {
  id: number; action_type: string; target_type: string; target_id: number;
  description: string; ip_address: string; created_at: string; admin: string;
}

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  ban: { bg: "#ffe0e0", color: "#c00" },
  unban: { bg: "#E1F2B6", color: "#48802c" },
  login: { bg: "#d0e8f5", color: "#256b9a" },
  edit: { bg: "#fff8d0", color: "#7a6000" },
  create: { bg: "#e0ffe0", color: "#256b25" },
};

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  function load(p = 1) {
    setLoading(true);
    const params: Record<string, string> = { page: String(p), limit: "50" };
    if (actionFilter) params.action_type = actionFilter;
    api.logs.list(params).then(data => {
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setLoading(false);
    });
  }

  useEffect(() => { load(page); }, [page, actionFilter]);

  const pages = Math.ceil(total / 50);

  return (
    <div>
      <h1 style={{ color: "#48802c", fontSize: "1.3em", marginBottom: 12, borderBottom: "1px solid #ccc", paddingBottom: 6 }}>
        Журнал действий <span style={{ fontSize: "0.7em", color: "#888" }}>({total})</span>
      </h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "#555" }}>Фильтр по типу:</label>
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          style={{ padding: "5px 8px", border: "1px solid #ccc", fontSize: 13 }}
        >
          <option value="">Все действия</option>
          <option value="login">Вход (login)</option>
          <option value="ban">Бан (ban)</option>
          <option value="unban">Разбан (unban)</option>
          <option value="edit">Редактирование (edit)</option>
          <option value="create">Создание (create)</option>
        </select>
      </div>

      {loading ? <div style={{ color: "#888" }}>Загрузка...</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#efefef" }}>
                <th style={th}>Время</th>
                <th style={th}>Тип</th>
                <th style={th}>Объект</th>
                <th style={th}>Описание</th>
                <th style={th}>Администратор</th>
                <th style={th}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => {
                const ac = ACTION_COLORS[l.action_type] || { bg: "#eee", color: "#555" };
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#f7f7f7" : "#fff" }}>
                    <td style={{ ...td, fontSize: 11, color: "#666", whiteSpace: "nowrap" }}>
                      {l.created_at ? new Date(l.created_at).toLocaleString("ru") : "—"}
                    </td>
                    <td style={td}>
                      <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 8, fontSize: 11, background: ac.bg, color: ac.color, fontWeight: "bold" }}>
                        {l.action_type}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: "#888" }}>
                      {l.target_type ? `${l.target_type} #${l.target_id}` : "—"}
                    </td>
                    <td style={td}>{l.description || "—"}</td>
                    <td style={{ ...td, fontWeight: "bold", color: "#48802c" }}>{l.admin || "—"}</td>
                    <td style={{ ...td, fontSize: 11, color: "#888" }}>{l.ip_address || "—"}</td>
                  </tr>
                );
              })}
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
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 10px", textAlign: "left", color: "#555", fontSize: 12, borderBottom: "1px solid #ddd" };
const td: React.CSSProperties = { padding: "6px 10px", fontSize: 13 };
