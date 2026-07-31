/* ConfigSection.jsx
   Sección del panel de admin para editar configuraciones del sistema.
   El instructor puede modificar el prompt de evaluación, los labels
   y el tiempo del timer sin tocar código.
*/

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const css = `
  .config-list { display: flex; flex-direction: column; gap: 20px; }

  .config-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-lg); overflow: hidden;
  }
  .config-card-header {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    background: var(--surface2);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .config-key {
    font-family: var(--mono); font-size: 12px; font-weight: 600;
    color: var(--blue-dk); background: var(--blue-light);
    padding: 2px 8px; border-radius: 4px; flex-shrink: 0;
  }
  .config-desc { font-size: 12.5px; color: var(--dim); line-height: 1.5; flex: 1; }

  .config-body { padding: 16px 18px; }

  textarea.config-value {
    width: 100%; font-family: var(--mono); font-size: 12.5px; line-height: 1.6;
    background: var(--surface2); color: var(--text);
    border: 1px solid var(--border); border-radius: var(--r);
    padding: 10px 12px; resize: vertical; outline: none;
    transition: border-color .15s;
    min-height: 120px;
  }
  textarea.config-value:focus { border-color: var(--blue); background: #fff; }
  textarea.config-value.tall { min-height: 420px; }

  input.config-value-short {
    width: 120px; font-family: var(--mono); font-size: 13px;
    background: var(--surface2); color: var(--text);
    border: 1px solid var(--border); border-radius: var(--r);
    padding: 8px 12px; outline: none; transition: border-color .15s;
  }
  input.config-value-short:focus { border-color: var(--blue); background: #fff; }

  .config-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 18px; border-top: 1px solid var(--border);
    background: var(--surface2);
  }
  .config-updated { font-size: 11.5px; color: var(--xdim); font-family: var(--mono); }

  .btn {
    font-family: var(--sans); font-size: 13px; font-weight: 600;
    border: none; border-radius: var(--r); padding: 8px 16px;
    cursor: pointer; transition: background .15s, transform .1s;
  }
  .btn:active { transform: scale(.97); }
  .btn-primary { background: var(--blue); color: #fff; }
  .btn-primary:hover { background: var(--blue-dk); }
  .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
  .btn-ghost {
    background: var(--surface); color: var(--dim);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { border-color: var(--xdim); color: var(--text); }

  .alert { padding: 10px 14px; border-radius: var(--r); font-size: 13px; margin-bottom: 16px; }
  .alert-error   { background: var(--red-bg); color: var(--red); }
  .alert-success { background: var(--green-bg); color: var(--green); }

  .saved-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 600; color: var(--green);
    animation: fadeIn .2s ease-out;
  }
  @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
`;

// Configuraciones que se muestran como campo de texto corto (no textarea)
const SHORT_KEYS = ["session_timer_seconds"];

export default function ConfigSection() {
  const { getToken } = useAuth();
  const [configs,  setConfigs]  = useState(null);
  const [error,    setError]    = useState(null);
  const [saved,    setSaved]    = useState({});   // { key: true } cuando se guarda

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`,
  }), [getToken]);

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/admin/config`, { headers: headers() });
      const data = await res.json();
      // Convertir array a objeto { key: config }
      const map  = {};
      data.forEach(c => { map[c.key] = c; });
      setConfigs(map);
    } catch (err) {
      setError(err.message);
    }
  }, [headers]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleChange = (key, value) => {
    setConfigs(prev => ({
      ...prev,
      [key]: { ...prev[key], value, _dirty: true },
    }));
    // Limpiar badge de guardado cuando el usuario edita
    setSaved(prev => ({ ...prev, [key]: false }));
  };

  const handleSave = async (key) => {
    const config = configs[key];
    try {
      const res = await fetch(`${API_URL}/admin/config/${key}`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ value: config.value }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setSaved(prev => ({ ...prev, [key]: true }));
      setConfigs(prev => ({ ...prev, [key]: { ...prev[key], _dirty: false } }));
    } catch (err) {
      setError(`No se pudo guardar "${key}": ${err.message}`);
    }
  };

  if (configs === null) return <div style={{ color: "var(--dim)" }}>Cargando…</div>;

  return (
    <>
      <style>{css}</style>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <div className="config-list">
        {Object.values(configs).map(config => {
          const isShort = SHORT_KEYS.includes(config.key);
          const isDirty = config._dirty;
          const wasSaved = saved[config.key];

          return (
            <div className="config-card" key={config.key}>
              <div className="config-card-header">
                <div>
                  <div className="config-key">{config.key}</div>
                  {config.description && (
                    <div className="config-desc" style={{ marginTop: 6 }}>
                      {config.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="config-body">
                {isShort ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      className="config-value-short"
                      value={config.value}
                      onChange={e => handleChange(config.key, e.target.value)}
                    />
                    <span style={{ fontSize: 12.5, color: "var(--dim)" }}>
                      {config.key === "session_timer_seconds" &&
                        `= ${Math.floor(Number(config.value) / 60)} min ${Number(config.value) % 60} seg`}
                    </span>
                  </div>
                ) : (
                  <textarea
                    className={`config-value ${config.key === "evaluation_prompt" ? "tall" : ""}`}
                    value={config.value}
                    onChange={e => handleChange(config.key, e.target.value)}
                    spellCheck={false}
                  />
                )}
              </div>

              <div className="config-footer">
                <div className="config-updated">
                  {config.updated_at
                    ? `Última edición: ${new Date(config.updated_at).toLocaleString("es-CO")}`
                    : ""}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {wasSaved && (
                    <span className="saved-badge">✓ Guardado</span>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSave(config.key)}
                    disabled={!isDirty}
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}