/* CatalogSection.jsx
   Sección genérica de catálogo — reutilizada para client_names, incidents, personalities

   FIX: useEffect ahora corre solo una vez al montar (array vacío)
   en vez de depender de `load`.
*/

import { useState, useEffect, useCallback } from "react";
import { useAdminApi } from "../useAdminApi";

const css = `
  .toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
  .btn {
    font-family: var(--sans); font-size: 13px; font-weight: 600;
    border: none; border-radius: var(--r); padding: 9px 16px;
    cursor: pointer; transition: background .15s, transform .1s;
  }
  .btn:active { transform: scale(.97); }
  .btn-primary { background: var(--blue); color: #fff; }
  .btn-primary:hover { background: var(--blue-dk); }
  .btn:disabled { opacity: .5; cursor: not-allowed; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; }

  .item-row {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; padding: 14px 18px;
    border-bottom: 1px solid var(--border);
  }
  .item-row:last-child { border-bottom: none; }
  .item-row.inactive { opacity: .55; }

  .item-main { flex: 1; min-width: 0; }
  .item-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
  .item-desc  { font-size: 13px; color: var(--dim); line-height: 1.5; }
  .item-tag {
    display: inline-block; font-size: 10.5px; font-weight: 600;
    font-family: var(--mono); text-transform: uppercase;
    color: var(--blue-dk); background: var(--blue-light);
    padding: 1px 7px; border-radius: 4px; margin-bottom: 5px;
  }

  .toggle {
    position: relative; width: 38px; height: 21px; flex-shrink: 0;
    background: var(--border); border-radius: 11px; cursor: pointer;
    border: none; transition: background .15s; margin-top: 2px;
  }
  .toggle.on { background: var(--green); }
  .toggle-knob {
    position: absolute; top: 2px; left: 2px;
    width: 17px; height: 17px; border-radius: 50%;
    background: #fff; transition: transform .15s;
    box-shadow: 0 1px 2px rgba(0,0,0,.2);
  }
  .toggle.on .toggle-knob { transform: translateX(17px); }

  .empty-state { padding: 48px 24px; text-align: center; color: var(--dim); }
  .empty-icon { font-size: 32px; margin-bottom: 10px; opacity: .6; }

  .inline-form {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 16px 18px; margin-bottom: 18px;
  }
  .form-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
  .form-field { flex: 1; min-width: 180px; }
  .form-field label { display: block; font-size: 12px; font-weight: 500; margin-bottom: 5px; }
  .form-field input, .form-field textarea {
    width: 100%; font-family: var(--sans); font-size: 13.5px;
    background: #fff; border: 1px solid var(--border);
    border-radius: var(--r); padding: 8px 11px; outline: none;
    transition: border-color .15s; resize: vertical;
  }
  .form-field input:focus, .form-field textarea:focus { border-color: var(--blue); }

  .alert { padding: 10px 14px; border-radius: var(--r); font-size: 13px; margin-bottom: 14px; }
  .alert-error { background: var(--red-bg); color: var(--red); }
`;

const CONFIG = {
  names: {
    addLabel: "+ Agregar nombre de cliente",
    fields: [{ key: "name", label: "Nombre completo", placeholder: "Ej: Marta López", type: "input" }],
    render: (item) => ({ title: item.name, desc: null, tag: null }),
  },
  incidents: {
    addLabel: "+ Agregar incidente",
    fields: [
      { key: "description", label: "Descripción del incidente", placeholder: "Ej: No puede acceder al VPN desde casa", type: "textarea" },
      { key: "category", label: "Categoría (opcional)", placeholder: "Ej: red, correo, hardware", type: "input" },
    ],
    render: (item) => ({ title: item.category || "Sin categoría", desc: item.description, tag: item.category }),
  },
  personalities: {
    addLabel: "+ Agregar personalidad",
    fields: [
      { key: "name", label: "Nombre", placeholder: "Ej: IMPACIENTE", type: "input" },
      { key: "description", label: "Descripción del comportamiento", placeholder: "Cómo debe actuar el modelo con esta personalidad", type: "textarea" },
    ],
    render: (item) => ({ title: item.name, desc: item.description, tag: null }),
  },
};

const API_MAP = {
  names:         { list: "listNames",         add: "addName",         toggle: "toggleName" },
  incidents:     { list: "listIncidents",      add: "addIncident",     toggle: "toggleIncident" },
  personalities: { list: "listPersonalities",  add: "addPersonality",  toggle: "togglePersonality" },
};

export default function CatalogSection({ type }) {
  const api = useAdminApi();
  const config = CONFIG[type];
  const methods = API_MAP[type];

  const [items, setItems]   = useState(null);
  const [error, setError]   = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api[methods.list]();
      setItems(data);
    } catch (err) {
      setError(err.message);
    }
  }, [api, methods.list]);

  // Solo corre cuando cambia `type` (cambio de pestaña) — no depende de `load`
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleToggle = async (id, current) => {
    try {
      await api[methods.toggle](id, !current);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <style>{css}</style>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : config.addLabel}
        </button>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {showForm && (
        <AddForm
          config={config}
          onSubmit={async (values) => {
            try {
              const args = config.fields.map(f => values[f.key] || null);
              await api[methods.add](...args);
              setShowForm(false);
              load();
            } catch (err) {
              setError(err.message);
            }
          }}
        />
      )}

      <div className="card">
        {items === null ? (
          <div className="empty-state">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div>Aún no hay elementos en este catálogo.</div>
          </div>
        ) : (
          items.map(item => {
            const r = config.render(item);
            return (
              <div className={`item-row ${!item.active ? "inactive" : ""}`} key={item.id}>
                <div className="item-main">
                  {r.tag && <div className="item-tag">{r.tag}</div>}
                  <div className="item-title">{r.title}</div>
                  {r.desc && <div className="item-desc">{r.desc}</div>}
                </div>
                <button
                  className={`toggle ${item.active ? "on" : ""}`}
                  onClick={() => handleToggle(item.id, item.active)}
                  title={item.active ? "Desactivar" : "Activar"}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function AddForm({ config, onSubmit }) {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(values);
    setLoading(false);
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <div className="form-row">
        {config.fields.map(f => (
          <div className="form-field" key={f.key}>
            <label>{f.label}</label>
            {f.type === "textarea" ? (
              <textarea
                rows={2}
                placeholder={f.placeholder}
                value={values[f.key] || ""}
                onChange={e => setValues({ ...values, [f.key]: e.target.value })}
                required={f.key !== "category"}
              />
            ) : (
              <input
                placeholder={f.placeholder}
                value={values[f.key] || ""}
                onChange={e => setValues({ ...values, [f.key]: e.target.value })}
                required={f.key !== "category"}
              />
            )}
          </div>
        ))}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}