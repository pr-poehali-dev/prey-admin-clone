import { useState } from "react";
import { login } from "@/lib/api";

interface Props { onLogin: () => void; }

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      setError((err as Error).message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#f0f0fa", minHeight: "100vh" }}>
      <div style={{ background: "#7da987", padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 28 }}>🐾</span>
        <span style={{ color: "#204b2a", fontSize: "1.4em", fontWeight: "bold" }}>Административная консоль Prey</span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <div style={{
          width: 340, background: "#f0f0fa", border: "1px solid #aab",
          boxShadow: "2px 2px 2px #eee"
        }}>
          <div style={{
            padding: "18px 26px 14px", background: "#f7f7ff",
            color: "#2e3741", fontSize: 18, fontWeight: "bold", marginBottom: 14
          }}>
            Вход в систему
          </div>

          {error && (
            <div style={{ margin: "0 26px 10px", padding: "6px 10px", background: "#fff3f3", border: "1px solid #ffaaaa", color: "#cc0000", fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ padding: "0 26px 20px" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#555", fontWeight: "bold", marginBottom: 4, fontSize: 14 }}>
                Пользователь:
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                style={{
                  width: "100%", padding: "6px 8px", border: "1px solid #ccc",
                  background: "#fcfcfc", fontSize: 14, boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#555", fontWeight: "bold", marginBottom: 4, fontSize: 14 }}>
                Пароль:
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", padding: "6px 8px", border: "1px solid #ccc",
                  background: "#fcfcfc", fontSize: 14, boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#7da987", color: "#fff", border: "none",
                padding: "7px 20px", cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14, borderRadius: 3
              }}
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          <div style={{ padding: "6px 26px 14px", fontSize: 12, color: "#888" }}>
            По умолчанию: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
}