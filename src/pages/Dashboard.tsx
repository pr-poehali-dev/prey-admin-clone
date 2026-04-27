import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Stats {
  total_players: number;
  banned_players: number;
  active_today: number;
  players_online: number;
  online_servers: number;
  total_servers: number;
  total_items: number;
}

interface Server { name: string; status: string; current: number; max: number; region: string; map: string; }
interface TopPlayer { username: string; level: number; kills: number; deaths: number; gold: number; }
interface Log { action: string; description: string; created_at: string; admin: string; }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard().then(data => {
      setStats(data.stats);
      setServers(data.servers || []);
      setTopPlayers(data.top_players || []);
      setLogs(data.recent_logs || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 20, color: "#666" }}>Загрузка...</div>;

  const statCards = [
    { label: "Всего игроков", value: stats?.total_players, color: "#48802c", bg: "#E1F2B6" },
    { label: "Онлайн сейчас", value: stats?.players_online, color: "#256b9a", bg: "#d0e8f5" },
    { label: "Активны сегодня", value: stats?.active_today, color: "#7a6000", bg: "#fff8d0" },
    { label: "Заблокированы", value: stats?.banned_players, color: "#c00", bg: "#ffe0e0" },
    { label: "Серверов онлайн", value: `${stats?.online_servers} / ${stats?.total_servers}`, color: "#48802c", bg: "#E1F2B6" },
    { label: "Предметов", value: stats?.total_items, color: "#555", bg: "#eee" },
  ];

  return (
    <div>
      <h1 style={{ color: "#48802c", fontSize: "1.3em", marginBottom: 16, borderBottom: "1px solid #ccc", paddingBottom: 6 }}>
        Дашборд
      </h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        {statCards.map(c => (
          <div key={c.label} style={{
            background: c.bg, border: `1px solid ${c.color}33`,
            borderRadius: 4, padding: "14px 20px", minWidth: 160,
            boxShadow: "1px 1px 3px #ccc"
          }}>
            <div style={{ fontSize: 28, fontWeight: "bold", color: c.color }}>{c.value ?? "—"}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ flex: "1 1 340px" }}>
          <h3 style={{ color: "#48802c", marginBottom: 8 }}>Статус серверов</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#efefef" }}>
                <th style={th}>Сервер</th>
                <th style={th}>Статус</th>
                <th style={th}>Игроки</th>
                <th style={th}>Карта</th>
              </tr>
            </thead>
            <tbody>
              {servers.map(s => (
                <tr key={s.name} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={td}>{s.name} <span style={{ fontSize: 11, color: "#888" }}>({s.region})</span></td>
                  <td style={td}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11,
                      background: s.status === "online" ? "#E1F2B6" : "#ffe0e0",
                      color: s.status === "online" ? "#48802c" : "#c00"
                    }}>
                      {s.status === "online" ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td style={td}>{s.current} / {s.max}</td>
                  <td style={td}>{s.map || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: "1 1 300px" }}>
          <h3 style={{ color: "#48802c", marginBottom: 8 }}>Топ игроков (убийства)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#efefef" }}>
                <th style={th}>#</th>
                <th style={th}>Игрок</th>
                <th style={th}>Ур.</th>
                <th style={th}>Убийств</th>
              </tr>
            </thead>
            <tbody>
              {topPlayers.map((p, i) => (
                <tr key={p.username} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#f7f7f7" : "#fff" }}>
                  <td style={{ ...td, color: "#888" }}>{i + 1}</td>
                  <td style={td}>{p.username}</td>
                  <td style={td}>{p.level}</td>
                  <td style={{ ...td, fontWeight: "bold", color: "#48802c" }}>{p.kills}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: "2 1 600px" }}>
          <h3 style={{ color: "#48802c", marginBottom: 8 }}>Последние действия</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#efefef" }}>
                <th style={th}>Время</th>
                <th style={th}>Тип</th>
                <th style={th}>Описание</th>
                <th style={th}>Админ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#f7f7f7" : "#fff" }}>
                  <td style={{ ...td, fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
                    {l.created_at ? new Date(l.created_at).toLocaleString("ru") : "—"}
                  </td>
                  <td style={td}>
                    <span style={{
                      display: "inline-block", padding: "1px 7px", borderRadius: 8, fontSize: 11,
                      background: actionBg(l.action), color: actionColor(l.action)
                    }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={td}>{l.description}</td>
                  <td style={td}>{l.admin || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 10px", textAlign: "left", fontWeight: "bold", color: "#555", fontSize: 12, borderBottom: "1px solid #ddd" };
const td: React.CSSProperties = { padding: "6px 10px", fontSize: 13, verticalAlign: "middle" };

function actionBg(a: string) {
  if (a === "ban") return "#ffe0e0";
  if (a === "unban") return "#E1F2B6";
  if (a === "login") return "#d0e8f5";
  return "#eee";
}
function actionColor(a: string) {
  if (a === "ban") return "#c00";
  if (a === "unban") return "#48802c";
  if (a === "login") return "#256b9a";
  return "#555";
}
