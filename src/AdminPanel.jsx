/* AdminPanel.jsx
   Shell del panel de administración — navegación entre secciones
*/

import { useState } from "react";
import { useAuth } from "./useAuth";
import LearnersSection     from "./admin/LearnersSection";
import CatalogSection      from "./admin/CatalogSection";
import SessionsSection     from "./admin/SessionsSection";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #f4f5f7;
    --surface:   #ffffff;
    --surface2:  #fafbfc;
    --border:    #e3e6ea;
    --text:      #181a1f;
    --dim:       #6b7280;
    --xdim:      #9aa1ad;
    --blue:      #2563eb;
    --blue-dk:   #1d4ed8;
    --blue-light:#eff6ff;
    --green:     #16a34a;
    --green-bg:  #f0fdf4;
    --red:       #dc2626;
    --red-bg:    #fef2f2;
    --amber:     #d97706;
    --amber-bg:  #fffbeb;
    --sans:      'Inter', sans-serif;
    --mono:      'JetBrains Mono', monospace;
    --r:         10px;
    --r-lg:      14px;
  }

  body { background: var(--bg); font-family: var(--sans); color: var(--text); }

  .shell {
    display: flex; height: 100dvh;
  }

  /* ── Sidebar ─────────────────────────────────────────────────────────────── */
  .sidebar {
    width: 240px; flex-shrink: 0;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    padding: 20px 14px;
  }

  .sidebar-brand {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px 20px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  }
  .brand-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--blue);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }
  .brand-text { line-height: 1.25; }
  .brand-title { font-size: 13px; font-weight: 600; }
  .brand-sub   { font-size: 11px; color: var(--dim); font-family: var(--mono); }

  .nav-group { margin-bottom: 20px; }
  .nav-label {
    font-size: 11px; font-weight: 600; color: var(--xdim);
    text-transform: uppercase; letter-spacing: .05em;
    padding: 0 10px; margin-bottom: 6px;
  }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; text-align: left;
    padding: 9px 10px; border-radius: var(--r);
    font-size: 13.5px; font-weight: 500; color: var(--dim);
    background: none; border: none; cursor: pointer;
    transition: background .12s, color .12s;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: var(--blue-light); color: var(--blue-dk); font-weight: 600; }
  .nav-icon { font-size: 15px; width: 18px; text-align: center; flex-shrink: 0; }

  .sidebar-footer {
    margin-top: auto;
    padding-top: 16px; border-top: 1px solid var(--border);
  }
  .user-chip {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: var(--r);
  }
  .user-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--surface2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; color: var(--dim);
    flex-shrink: 0;
  }
  .user-name { font-size: 12.5px; font-weight: 600; line-height: 1.3; }
  .user-role { font-size: 11px; color: var(--dim); }
  .btn-logout {
    width: 100%; margin-top: 8px;
    font-size: 12px; color: var(--dim);
    background: none; border: 1px solid var(--border);
    border-radius: var(--r); padding: 7px;
    cursor: pointer; transition: border-color .15s, color .15s;
  }
  .btn-logout:hover { border-color: var(--red); color: var(--red); }

  /* ── Main content ───────────────────────────────────────────────────────── */
  .main {
    flex: 1; overflow-y: auto;
    padding: 32px 40px;
  }
  .main-header { margin-bottom: 24px; }
  .main-title { font-size: 21px; font-weight: 700; }
  .main-sub   { font-size: 13.5px; color: var(--dim); margin-top: 3px; }
`;

const SECTIONS = [
  { id: "learners",  label: "Learners",     icon: "👤", group: "Usuarios" },
  { id: "names",     label: "Clientes",     icon: "🪪", group: "Catálogo" },
  { id: "incidents", label: "Incidentes",   icon: "⚠️", group: "Catálogo" },
  { id: "personas",  label: "Personalidades", icon: "🎭", group: "Catálogo" },
  { id: "sessions",  label: "Sesiones",     icon: "📊", group: "Reportes" },
];

const TITLES = {
  learners:  ["Learners", "Crea, edita y carga especialistas en lote"],
  names:     ["Catálogo de clientes", "Nombres ficticios usados en las simulaciones"],
  incidents: ["Catálogo de incidentes", "Problemas técnicos que enfrentan los learners"],
  personas:  ["Catálogo de personalidades", "Perfiles de comportamiento del cliente-IA"],
  sessions:  ["Sesiones", "Historial de práctica de todos los learners"],
};

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState("learners");

  const groups = [...new Set(SECTIONS.map(s => s.group))];
  const [title, sub] = TITLES[section];

  const initials = (user?.full_name || "A")
    .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">🎧</div>
            <div className="brand-text">
              <div className="brand-title">Soporte TI</div>
              <div className="brand-sub">admin</div>
            </div>
          </div>

          {groups.map(group => (
            <div className="nav-group" key={group}>
              <div className="nav-label">{group}</div>
              {SECTIONS.filter(s => s.group === group).map(s => (
                <button
                  key={s.id}
                  className={`nav-item ${section === s.id ? "active" : ""}`}
                  onClick={() => setSection(s.id)}
                >
                  <span className="nav-icon">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          ))}

          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div>
                <div className="user-name">{user?.full_name}</div>
                <div className="user-role">Administrador</div>
              </div>
            </div>
            <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
          </div>
        </nav>

        {/* Main content */}
        <main className="main">
          <div className="main-header">
            <div className="main-title">{title}</div>
            <div className="main-sub">{sub}</div>
          </div>

          {section === "learners"  && <LearnersSection />}
          {section === "names"     && <CatalogSection type="names" />}
          {section === "incidents" && <CatalogSection type="incidents" />}
          {section === "personas"  && <CatalogSection type="personalities" />}
          {section === "sessions"  && <SessionsSection />}
        </main>

      </div>
    </>
  );
}
