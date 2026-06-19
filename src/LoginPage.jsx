/* LoginPage.jsx
   Pantalla de login — estética de herramienta interna corporativa
*/

import { useState } from "react";
import { useAuth } from "./useAuth";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #f0f2f5;
    --surface:  #ffffff;
    --border:   #e1e4e8;
    --text:     #1c1e21;
    --dim:      #6b7280;
    --blue:     #2563eb;
    --blue-dk:  #1d4ed8;
    --red:      #dc2626;
    --sans:     'Inter', sans-serif;
    --mono:     'JetBrains Mono', monospace;
    --r:        10px;
  }

  body { background: var(--bg); font-family: var(--sans); }

  .page {
    min-height: 100dvh;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 44px 40px;
    width: 100%; max-width: 380px;
    box-shadow: 0 4px 32px rgba(0,0,0,.07);
  }

  .brand {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 28px;
  }
  .brand-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: var(--blue);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .brand-name {
    font-family: var(--mono); font-size: 13px;
    font-weight: 500; color: var(--text);
    line-height: 1.3;
  }
  .brand-sub { font-size: 11px; color: var(--dim); }

  .title { font-size: 19px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .subtitle { font-size: 13px; color: var(--dim); margin-bottom: 28px; line-height: 1.5; }

  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .field label { font-size: 13px; font-weight: 500; color: var(--text); }

  .field input {
    font-family: var(--sans); font-size: 14px;
    background: #f8f9fa; color: var(--text);
    border: 1px solid var(--border); border-radius: var(--r);
    padding: 10px 14px; outline: none;
    transition: border-color .15s, background .15s;
  }
  .field input:focus { border-color: var(--blue); background: #fff; }
  .field input::placeholder { color: #b0b8c4; }
  .field input:disabled { opacity: .5; }

  .error {
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: var(--r); padding: 10px 14px;
    font-size: 13px; color: var(--red); margin-bottom: 16px;
    display: flex; gap: 8px; align-items: flex-start;
  }

  .btn {
    width: 100%; font-family: var(--sans);
    font-size: 14px; font-weight: 600;
    background: var(--blue); color: #fff; border: none;
    border-radius: var(--r); padding: 11px;
    cursor: pointer; margin-top: 4px;
    transition: background .15s, transform .1s;
  }
  .btn:hover:not(:disabled) { background: var(--blue-dk); }
  .btn:active:not(:disabled) { transform: scale(.98); }
  .btn:disabled { opacity: .55; cursor: not-allowed; }

  .footer {
    margin-top: 24px; text-align: center;
    font-size: 12px; color: var(--dim); line-height: 1.6;
  }
`;

export default function LoginPage() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthProvider detecta el cambio y App.jsx redirige automáticamente
    } catch (err) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="page">
        <div className="card">
          <div className="brand">
            <div className="brand-icon">🎧</div>
            <div>
              <div className="brand-name">Soporte TI</div>
              <div className="brand-sub">Simulador de atención</div>
            </div>
          </div>

          <div className="title">Bienvenido</div>
          <div className="subtitle">
            Accede con las credenciales que te asignó tu administrador.
          </div>

          {error && (
            <div className="error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                disabled={loading}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>
            <button className="btn" type="submit" disabled={loading || !email || !password}>
              {loading ? "Iniciando sesión…" : "Iniciar sesión"}
            </button>
          </form>

          <div className="footer">
            ¿Problemas para acceder? Contacta a tu administrador.
          </div>
        </div>
      </div>
    </>
  );
}