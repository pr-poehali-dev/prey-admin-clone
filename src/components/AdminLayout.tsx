import { getAdminInfo, logout } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const NAV = [
  { key: "dashboard", label: "Главная", icon: "🏠" },
  { key: "players", label: "Игроки", icon: "👥" },
  { key: "servers", label: "Серверы", icon: "🖥️" },
  { key: "items", label: "Предметы", icon: "🎒" },
  { key: "logs", label: "Журнал", icon: "📋" },
];

interface Props {
  section: string;
  onSection: (s: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({ section, onSection, onLogout, children }: Props) {
  const admin = getAdminInfo();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{ background: "#7da987", padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24 }}>🐾</span>
          <span style={{ color: "#204b2a", fontSize: "1.3em", fontWeight: "bold" }}>Административная консоль Prey</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#204b2a", fontSize: 13 }}>
          <span>👤 {admin.username} ({admin.role})</span>
          <button
            onClick={() => navigate("/game")}
            style={{ background: "#3a8a50", color: "#fff", border: "none", padding: "4px 12px", cursor: "pointer", borderRadius: 3, fontSize: 12 }}
          >
            🎮 Играть
          </button>
          <button
            onClick={handleLogout}
            style={{ background: "#204b2a", color: "#fff", border: "none", padding: "4px 12px", cursor: "pointer", borderRadius: 3, fontSize: 12 }}
          >
            Выход
          </button>
        </div>
      </div>

      <div style={{ background: "#efefef", padding: "6px 12px", boxShadow: "0 0 3px 1px #aaa", display: "flex", gap: 4, flexWrap: "wrap" }}>
        {NAV.map(n => (
          <button
            key={n.key}
            onClick={() => onSection(n.key)}
            style={{
              background: section === n.key ? "#7da987" : "transparent",
              color: section === n.key ? "#fff" : "#444",
              border: "none", padding: "5px 14px", cursor: "pointer",
              borderRadius: 4, fontSize: 13, fontWeight: section === n.key ? "bold" : "normal",
              display: "flex", alignItems: "center", gap: 5
            }}
          >
            <span>{n.icon}</span> {n.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {children}
      </div>
    </div>
  );
}