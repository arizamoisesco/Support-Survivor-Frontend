/* SessionsSection.jsx
   Reporte de sesiones — quién practicó, con qué caso, cuándo

   FIX: el useEffect ahora corre solo una vez al montar (array de
   dependencias vacío) en vez de depender de `load`, que evita
   cualquier loop si `load` llegara a cambiar de identidad.
*/

import { useState, useEffect, useCallback } from "react";
import { useAdminApi } from "../useAdminApi";

const css = `
  .filters { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
  .filter-chip {
    font-size: 12.5px; font-weight: 500; padding: 6px 13px;
    border-radius: 20px; border: 1px solid var(--border);
    background: var(--surface); cursor: pointer; color: var(--dim);
    transition: border-color .15s, color .15s, background .15s;
  }
  .filter-chip.active { background: var(--blue); color: #fff; border-color: var(--blue); }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; }

  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  thead th {
    text-align: left; font-weight: 600; color: var(--dim);
    font-size: 11.5px; text-transform: uppercase; letter-spacing: .03em;
    padding: 11px 16px; background: var(--surface2);
    border-bottom: 1px solid var(--border);
  }
  tbody td { padding: 11px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--surface2); }

  .status-pill {
    display: inline-block; font-size: 11px; font-weight: 600;
    padding: 2px 9px; border-radius: 20px; font-family: var(--mono);
  }
  .status-active    { background: var(--amber-bg); color: var(--amber); }
  .status-completed { background: var(--green-bg); color: var(--green); }
  .status-abandoned { background: var(--red-bg); color: var(--red); }

  .learner-name { font-weight: 600; }
  .learner-cohort { font-size: 11.5px; color: var(--dim); margin-top: 1px; }

  .scenario-name { font-weight: 500; }
  .scenario-detail { font-size: 12px; color: var(--dim); margin-top: 2px; }

  .empty-state { padding: 48px 24px; text-align: center; color: var(--dim); }
  .empty-icon { font-size: 32px; margin-bottom: 10px; opacity: .6; }

  .refresh-btn {
    font-size: 12.5px; font-weight: 500; color: var(--dim);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r); padding: 6px 13px; cursor: pointer;
    transition: border-color .15s, color .15s;
  }
  .refresh-btn:hover { border-color: var(--blue); color: var(--blue-dk); }
`;

const STATUS_LABELS = {
  active:    ["En curso", "status-active"],
  completed: ["Completada", "status-completed"],
  abandoned: ["Abandonada", "status-abandoned"],
};

export default function SessionsSection() {
  const api = useAdminApi();
  const [sessions, setSessions] = useState(null);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState("all");

  const load = useCallback(async () => {
    try {
      const data = await api.listSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message);
    }
  }, [api]);

  // Solo corre UNA VEZ al montar el componente.
  // No depende de `load` para evitar cualquier re-disparo en cascada.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = sessions?.filter(s => filter === "all" || s.status === filter) ?? [];

  return (
    <>
      <style>{css}</style>

      <div className="filters" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {["all", "active", "completed", "abandoned"].map(f => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : STATUS_LABELS[f][0]}
            </button>
          ))}
        </div>
        <button className="refresh-btn" onClick={load}>↻ Actualizar</button>
      </div>

      {error && <div style={{ color: "var(--red)", marginBottom: 14, fontSize: 13 }}>⚠ {error}</div>}

      <div className="card">
        {sessions === null ? (
          <div className="empty-state">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div>No hay sesiones para mostrar.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Learner</th>
                <th>Caso</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Fin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const [label, cls] = STATUS_LABELS[s.status] || ["—", ""];
                const combo = s.scenario_combinations || {};
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="learner-name">{s.profiles?.full_name}</div>
                      <div className="learner-cohort">
                        Cohorte {s.profiles?.cohort} · {s.profiles?.email}
                      </div>
                    </td>
                    <td>
                      <div className="scenario-name">{combo.client_names?.name || "—"}</div>
                      <div className="scenario-detail">
                        {combo.incidents?.description?.slice(0, 50)}
                        {combo.incidents?.description?.length > 50 ? "…" : ""}
                      </div>
                      <div className="scenario-detail">{combo.personalities?.name}</div>
                    </td>
                    <td><span className={`status-pill ${cls}`}>{label}</span></td>
                    <td style={{ fontSize: "12.5px", color: "var(--dim)" }}>
                      {new Date(s.started_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td style={{ fontSize: "12.5px", color: "var(--dim)" }}>
                      {s.ended_at
                        ? new Date(s.ended_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}