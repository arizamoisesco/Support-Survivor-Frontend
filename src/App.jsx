// App.jsx — enrutamiento por rol y estado de autenticación

import { AuthProvider, useAuth } from "./useAuth";
import LoginPage   from "./LoginPage";
import SoporteChat from "./SoporteChat";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f0f2f5; }

  .loading {
    height: 100dvh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px; color: #6b7280; font-size: 14px;
  }
  .loading-spinner {
    width: 28px; height: 28px;
    border: 2px solid #e1e4e8;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

function AppRoutes() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="loading">
          <div className="loading-spinner" />
          <span>Cargando…</span>
        </div>
      </>
    );
  }

  // Sin sesión → login
  if (!user) return <LoginPage />;

  // Learner → chat de soporte
  if (user.role === "learner") {
    return <SoporteChat />;
  }

  // Admin → panel (próxima iteración)
  if (user.role === "admin") {
    return (
      <>
        <style>{css}</style>
        <div className="loading">
          <span>👋 Hola, {user.full_name}</span>
          <span style={{ fontSize: "12px" }}>Panel de administración — próximamente</span>
          <button
            onClick={logout}
            style={{
              marginTop: "8px", padding: "8px 16px",
              background: "none", border: "1px solid #e1e4e8",
              borderRadius: "8px", cursor: "pointer",
              fontSize: "13px", color: "#6b7280"
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </>
    );
  }

  // Rol desconocido → logout automático
  logout();
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}