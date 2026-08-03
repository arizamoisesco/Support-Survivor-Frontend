/* SessionsSection.jsx
   Reporte de sesiones — quién practicó, con qué caso, cuándo

   FIX: el useEffect ahora corre solo una vez al montar (array de
   dependencias vacío) en vez de depender de `load`, que evita
   cualquier loop si `load` llegara a cambiar de identidad.
*/

/* SessionsSection.jsx
   Historial de sesiones con modal de detalle al hacer clic en una fila.
   El modal muestra puntajes por criterio, retroalimentación y conversación.
*/

import { useState, useEffect, useCallback } from "react";
import { useAdminApi } from "../useAdminApi";
import { useAuth } from "../useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const css = `
  .filters {
    display: flex; gap: 10px; margin-bottom: 18px;
    flex-wrap: wrap; justify-content: space-between; align-items: center;
  }
  .filters-left { display: flex; gap: 10px; flex-wrap: wrap; }
  .filter-chip {
    font-size: 12.5px; font-weight: 500; padding: 6px 13px;
    border-radius: 20px; border: 1px solid var(--border);
    background: var(--surface); cursor: pointer; color: var(--dim);
    transition: border-color .15s, color .15s, background .15s;
  }
  .filter-chip.active { background: var(--blue); color: #fff; border-color: var(--blue); }
  .refresh-btn {
    font-size: 12.5px; font-weight: 500; color: var(--dim);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r); padding: 6px 13px; cursor: pointer;
  }
  .refresh-btn:hover { border-color: var(--blue); color: var(--blue-dk); }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; }

  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  thead th {
    text-align: left; font-weight: 600; color: var(--dim);
    font-size: 11.5px; text-transform: uppercase; letter-spacing: .03em;
    padding: 11px 16px; background: var(--surface2); border-bottom: 1px solid var(--border);
  }
  tbody td { padding: 11px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr.clickable { cursor: pointer; transition: background .12s; }
  tbody tr.clickable:hover { background: var(--blue-light); }

  .status-pill {
    display: inline-block; font-size: 11px; font-weight: 600;
    padding: 2px 9px; border-radius: 20px; font-family: var(--mono);
  }
  .status-active    { background: var(--amber-bg); color: var(--amber); }
  .status-completed { background: var(--green-bg); color: var(--green); }
  .status-abandoned { background: var(--red-bg);   color: var(--red);   }

  .score-badge { display: inline-flex; align-items: baseline; gap: 2px; font-family: var(--mono); font-size: 13px; font-weight: 700; }
  .score-den   { font-size: 10px; color: var(--dim); font-weight: 400; }

  .learner-name   { font-weight: 600; }
  .learner-detail { font-size: 11.5px; color: var(--dim); margin-top: 1px; }
  .scenario-name  { font-weight: 500; }
  .scenario-detail{ font-size: 12px; color: var(--dim); margin-top: 2px; }

  .empty-state { padding: 48px 24px; text-align: center; color: var(--dim); }
  .empty-icon  { font-size: 32px; margin-bottom: 10px; opacity: .6; }

  /* ── Modal ── */
  .overlay {
    position: fixed; inset: 0; background: rgba(20,22,26,.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 50; padding: 20px;
  }
  .detail-modal {
    background: var(--surface); border-radius: 16px;
    width: 100%; max-width: 600px; max-height: 90dvh;
    overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.2);
  }
  .detail-modal::-webkit-scrollbar { width: 4px; }
  .detail-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .detail-header {
    padding: 18px 22px; border-bottom: 1px solid var(--border);
    display: flex; align-items: flex-start; justify-content: space-between;
    position: sticky; top: 0; background: var(--surface); z-index: 1;
  }
  .detail-title    { font-size: 16px; font-weight: 700; }
  .detail-subtitle { font-size: 12.5px; color: var(--dim); margin-top: 3px; }
  .modal-close {
    background: none; border: none; cursor: pointer;
    color: var(--xdim); font-size: 18px; padding: 2px 6px; flex-shrink: 0;
  }

  .detail-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 20px; }

  .score-hero {
    display: flex; align-items: center; gap: 16px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--r); padding: 14px 18px;
  }
  .score-hero-num  { font-size: 40px; font-weight: 700; font-family: var(--mono); line-height: 1; }
  .score-hero-den  { font-size: 16px; color: var(--dim); }
  .score-hero-info { flex: 1; }
  .score-hero-label{ font-size: 12px; color: var(--dim); }
  .score-hero-name { font-size: 14px; font-weight: 600; margin-top: 2px; }
  .score-hero-meta { font-size: 12px; color: var(--dim); font-family: var(--mono); margin-top: 2px; }

  .section-title {
    font-size: 12px; font-weight: 700; color: var(--dim);
    text-transform: uppercase; letter-spacing: .04em; margin-bottom: 10px;
  }

  .criteria-list { display: flex; flex-direction: column; gap: 8px; }
  .criterion-row { display: flex; align-items: center; gap: 10px; }
  .criterion-label { flex: 1; font-size: 12.5px; }
  .criterion-bar-wrap { width: 100px; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
  .criterion-bar   { height: 100%; border-radius: 3px; }
  .criterion-score { font-family: var(--mono); font-size: 12px; font-weight: 700; width: 28px; text-align: right; flex-shrink: 0; }

  .feedback-card   { border-radius: var(--r); padding: 14px 16px; }
  .feedback-card.positive { background: var(--green-bg); border: 1px solid #bbf7d0; }
  .feedback-card.improve  { background: var(--amber-bg); border: 1px solid #fde68a; }
  .feedback-label  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
  .feedback-card.positive .feedback-label { color: var(--green); }
  .feedback-card.improve  .feedback-label { color: var(--amber); }
  .feedback-text   { font-size: 13.5px; line-height: 1.65; }

  .messages-list {
    display: flex; flex-direction: column; gap: 8px;
    max-height: 300px; overflow-y: auto;
    border: 1px solid var(--border); border-radius: var(--r); padding: 12px;
  }
  .msg-row           { display: flex; flex-direction: column; gap: 2px; }
  .msg-row.user      { align-items: flex-end; }
  .msg-row.assistant { align-items: flex-start; }
  .msg-role { font-size: 10px; color: var(--xdim); padding: 0 4px; text-transform: uppercase; letter-spacing: .04em; }
  .msg-bubble { max-width: 85%; padding: 8px 12px; font-size: 13px; line-height: 1.55; word-break: break-word; white-space: pre-wrap; }
  .msg-row.user .msg-bubble      { background: var(--blue); color: #fff; border-radius: 10px 10px 3px 10px; }
  .msg-row.assistant .msg-bubble { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px 10px 10px 3px; }

  .no-eval { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; font-size: 13px; color: var(--dim); text-align: center; }

  .detail-footer {
    padding: 14px 22px; border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end;
    position: sticky; bottom: 0; background: var(--surface);
  }
  .btn-ghost {
    font-family: var(--sans); font-size: 13px; font-weight: 500;
    background: var(--surface); color: var(--dim);
    border: 1px solid var(--border); border-radius: var(--r);
    padding: 8px 16px; cursor: pointer;
  }
  .btn-ghost:hover { border-color: var(--xdim); color: var(--text); }
`;

const STATUS_LABELS = {
  active:    ["En curso",   "status-active"],
  completed: ["Completada", "status-completed"],
  abandoned: ["Abandonada", "status-abandoned"],
};

const CRITERIA_LABELS = {
  ciclo_gestion:            "Ciclo de gestión",
  lenguaje_positivo:        "Lenguaje positivo",
  reconocimiento_emociones: "Reconoc. emociones",
  adaptacion_perfil:        "Adaptación al perfil",
  estructura_conversacion:  "Estructura",
  claridad_concision:       "Claridad y concisión",
  gramatica_ortografia:     "Gramática",
};

function getScoreColor(score) {
  if (score >= 6) return "var(--green)";
  if (score >= 4) return "var(--amber)";
  return "var(--red)";
}

export default function SessionsSection() {
  const api = useAdminApi();
  const { getToken } = useAuth();
  const [sessions,   setSessions]   = useState(null);
  const [error,      setError]      = useState(null);
  const [filter,     setFilter]     = useState("all");
  const [selected,   setSelected]   = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [loadingMsg, setLoadingMsg] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message);
    }
  }, [api]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleRowClick = async (session) => {
    setSelected(session);
    setMessages([]);
    setLoadingMsg(true);
    try {
      const res = await fetch(`${API_URL}/admin/sessions/${session.id}/messages`, {
        headers: { "Authorization": `Bearer ${getToken()}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch { /* sin mensajes */ }
    finally { setLoadingMsg(false); }
  };

  const handleClose = () => { setSelected(null); setMessages([]); };

  const filtered = sessions?.filter(s => filter === "all" || s.status === filter) ?? [];

  const getScenarioName = (s) => {
    if (s.session_type === "scenario" && s.scenarios?.title) return s.scenarios.title;
    return s.scenario_combinations?.client_names?.name || "—";
  };

  const getScenarioDetail = (s) => {
    const desc = s.scenario_combinations?.incidents?.description;
    if (!desc) return null;
    return desc.slice(0, 55) + (desc.length > 55 ? "…" : "");
  };

  return (
    <>
      <style>{css}</style>

      <div className="filters">
        <div className="filters-left">
          {["all", "active", "completed", "abandoned"].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
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
          <div className="empty-state"><div className="empty-icon">📊</div><div>No hay sesiones.</div></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Learner</th>
                <th>Caso</th>
                <th>Puntaje</th>
                <th>Estado</th>
                <th>Inicio</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const [label, cls] = STATUS_LABELS[s.status] || ["—", ""];
                const score = s.evaluations?.total_score;
                return (
                  <tr key={s.id} className="clickable" onClick={() => handleRowClick(s)}>
                    <td>
                      <div className="learner-name">{s.profiles?.full_name}</div>
                      <div className="learner-detail">Cohorte {s.profiles?.cohort} · {s.profiles?.email}</div>
                    </td>
                    <td>
                      <div className="scenario-name">{getScenarioName(s)}</div>
                      {getScenarioDetail(s) && <div className="scenario-detail">{getScenarioDetail(s)}</div>}
                    </td>
                    <td>
                      {score != null
                        ? <span className="score-badge" style={{ color: getScoreColor(score) }}>{score}<span className="score-den">/7</span></span>
                        : <span style={{ color: "var(--xdim)", fontSize: 12 }}>—</span>}
                    </td>
                    <td><span className={`status-pill ${cls}`}>{label}</span></td>
                    <td style={{ fontSize: "12px", color: "var(--dim)" }}>
                      {new Date(s.started_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <div className="detail-modal">
            <div className="detail-header">
              <div>
                <div className="detail-title">{selected.profiles?.full_name}</div>
                <div className="detail-subtitle">{getScenarioName(selected)} · Cohorte {selected.profiles?.cohort}</div>
              </div>
              <button className="modal-close" onClick={handleClose}>✕</button>
            </div>

            <div className="detail-body">
              {selected.evaluations?.total_score != null ? (
                <>
                  <div className="score-hero">
                    <div>
                      <span className="score-hero-num" style={{ color: getScoreColor(selected.evaluations.total_score) }}>
                        {selected.evaluations.total_score}
                      </span>
                      <span className="score-hero-den">/7</span>
                    </div>
                    <div className="score-hero-info">
                      <div className="score-hero-label">Puntaje total</div>
                      <div className="score-hero-name">{selected.profiles?.full_name}</div>
                      <div className="score-hero-meta">
                        {new Date(selected.started_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                        {selected.duration_seconds && ` · ${Math.floor(selected.duration_seconds / 60)}m ${selected.duration_seconds % 60}s`}
                      </div>
                    </div>
                  </div>

                  {selected.evaluations.criteria_scores && (
                    <div>
                      <div className="section-title">Criterios</div>
                      <div className="criteria-list">
                        {Object.entries(selected.evaluations.criteria_scores).map(([key, score]) => (
                          <div className="criterion-row" key={key}>
                            <div className="criterion-label">{CRITERIA_LABELS[key] || key}</div>
                            <div className="criterion-bar-wrap">
                              <div className="criterion-bar" style={{ width: `${(score / 7) * 100}%`, background: getScoreColor(score) }} />
                            </div>
                            <div className="criterion-score" style={{ color: getScoreColor(score) }}>{score}/7</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.evaluations.feedback_positive && (
                    <div className="feedback-card positive">
                      <div className="feedback-label">✓ Lo que hizo bien</div>
                      <div className="feedback-text">{selected.evaluations.feedback_positive}</div>
                    </div>
                  )}
                  {selected.evaluations.feedback_improve && (
                    <div className="feedback-card improve">
                      <div className="feedback-label">↑ Oportunidades de mejora</div>
                      <div className="feedback-text">{selected.evaluations.feedback_improve}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-eval">
                  {selected.status === "active"
                    ? "Sesión en curso — la evaluación aparecerá al terminar."
                    : "Esta sesión no tiene evaluación disponible."}
                </div>
              )}

              <div>
                <div className="section-title">
                  Conversación {loadingMsg ? "— cargando…" : `(${messages.length} mensajes)`}
                </div>
                {messages.length > 0 ? (
                  <div className="messages-list">
                    {messages.map((msg, i) => (
                      <div key={i} className={`msg-row ${msg.role}`}>
                        <div className="msg-role">{msg.role === "user" ? "Especialista" : "Cliente"}</div>
                        <div className="msg-bubble">{msg.content}</div>
                      </div>
                    ))}
                  </div>
                ) : !loadingMsg ? (
                  <div className="no-eval">No hay mensajes registrados.</div>
                ) : null}
              </div>
            </div>

            <div className="detail-footer">
              <button className="btn-ghost" onClick={handleClose}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}