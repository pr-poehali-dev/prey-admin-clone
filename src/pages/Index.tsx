import { useState } from "react";
import { isAuthenticated } from "@/lib/api";
import Login from "./Login";
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "./Dashboard";
import Players from "./Players";
import Servers from "./Servers";
import Items from "./Items";
import Logs from "./Logs";

export default function Index() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [section, setSection] = useState("dashboard");

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    players: <Players />,
    servers: <Servers />,
    items: <Items />,
    logs: <Logs />,
  };

  return (
    <AdminLayout section={section} onSection={setSection} onLogout={() => setAuthed(false)}>
      {pages[section] ?? <Dashboard />}
    </AdminLayout>
  );
}
