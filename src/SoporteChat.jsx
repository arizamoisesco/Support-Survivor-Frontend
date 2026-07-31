/* SoporteChat.jsx
   Simulador de soporte TI — especialista (humano) vs cliente frustrado (IA)
   Estética: panel de helpdesk corporativo, limpio y funcional

   NUEVO: botón "Cerrar caso" en el header del chat que llama a
   completeSession(), revela quién era el cliente en un modal,
   y luego permite iniciar un caso nuevo.

   - Botón "Cerrar caso": termina la práctica actual y revela el escenario
   - Menú de cuenta (esquina superior derecha): cerrar sesión de la cuenta
*/

/* SoporteChat.jsx — versión final
   Timer de 3 minutos + evaluación automática al terminar
   Sin botón de cerrar caso — el tiempo lo cierra todo
*/

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useSoporteChat } from "./useSoporteChat";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #f4f5f7;
    --surface:     #ffffff;
    --surface2:    #f8f9fa;
    --border:      #e1e4e8;
    --text:        #1c1e21;
    --text-dim:    #6b7280;
    --text-xdim:   #9ca3af;
    --agent:       #2563eb;
    --agent-light: #eff6ff;
    --agent-dark:  #1d4ed8;
    --online:      #16a34a;
    --red:         #dc2626;
    --red-bg:      #fef2f2;
    --amber:       #d97706;
    --amber-bg:    #fffbeb;
    --green:       #16a34a;
    --green-bg:    #f0fdf4;
    --mono:        'JetBrains Mono', monospace;
    --sans:        'Inter', sans-serif;
    --r:           12px;
    --r-sm:        8px;
  }

  body { background: var(--bg); font-family: var(--sans); }

  .app {
    display: flex; flex-direction: column; height: 100dvh;
    max-width: 720px; margin: 0 auto;
    background: var(--surface); box-shadow: 0 0 0 1px var(--border);
  }

  /* ── Topbar de cuenta ───────────────────────────────────────────────────── */
  .topbar {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 7px 16px; gap: 8px;
    background: var(--surface2); border-bottom: 1px solid var(--border);
    flex-shrink: 0; position: relative;
  }
  .account-trigger {
    display: flex; align-items: center; gap: 7px;
    background: none; border: none; cursor: pointer;
    padding: 3px 8px; border-radius: var(--r-sm);
    transition: background .15s;
  }
  .account-trigger:hover { background: var(--surface); }
  .account-avatar {
    width: 24px; height: 24px; border-radius: 50%;
    background: var(--surface); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: var(--text-dim);
  }
  .account-name { font-size: 12px; font-weight: 500; color: var(--text); }
  .account-menu {
    position: absolute; top: 40px; right: 16px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r); box-shadow: 0 8px 28px rgba(0,0,0,.12);
    min-width: 200px; z-index: 40; overflow: hidden;
  }
  .account-menu-header { padding: 12px 14px; border-bottom: 1px solid var(--border); }
  .account-menu-name   { font-size: 13px; font-weight: 600; }
  .account-menu-email  { font-size: 11.5px; color: var(--text-dim); font-family: var(--mono); margin-top: 2px; }
  .account-menu-cohort {
    display: inline-block; margin-top: 6px;
    font-size: 10.5px; font-weight: 600; font-family: var(--mono);
    color: var(--agent-dark); background: var(--agent-light);
    padding: 1px 8px; border-radius: 20px;
  }
  .account-menu-item {
    display: flex; align-items: center; gap: 8px; width: 100%;
    padding: 10px 14px; font-size: 13px; font-weight: 500;
    color: var(--red); background: none; border: none; cursor: pointer;
    transition: background .15s;
  }
  .account-menu-item:hover { background: var(--red-bg); }

  /* ── Header del chat ─────────────────────────────────────────────────────── */
  .header {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 20px; background: var(--surface);
    border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: #fef9c3; border: 1.5px solid #fde047;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }
  .header-info { flex: 1; min-width: 0; }
  .header-name { font-size: 13.5px; font-weight: 600; color: var(--text); }
  .header-meta {
    display: flex; align-items: center; gap: 5px;
    margin-top: 1px; font-size: 11.5px; color: var(--text-dim);
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--online); flex-shrink: 0;
  }
  .status-dot.typing  { background: var(--text-xdim); animation: blink 1s ease-in-out infinite; }
  .status-dot.offline { background: var(--border); }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

  /* ── Timer ────────────────────────────────────────────────────────────────── */
  .timer {
    display: flex; align-items: center; gap: 5px;
    font-family: var(--mono); font-size: 14px; font-weight: 700;
    padding: 4px 12px; border-radius: 20px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text-dim); flex-shrink: 0;
    transition: background .3s, color .3s, border-color .3s;
  }
  .timer.warning {
    background: var(--amber-bg); border-color: #fde68a;
    color: var(--amber); animation: pulse-timer 1s ease-in-out infinite;
  }
  .timer.danger {
    background: var(--red-bg); border-color: #fecaca;
    color: var(--red); animation: pulse-timer .5s ease-in-out infinite;
  }
  @keyframes pulse-timer { 0%,100%{opacity:1} 50%{opacity:.6} }

  /* ── Pantalla de inicio ───────────────────────────────────────────────────── */
  .start-screen {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 20px;
    padding: 40px; text-align: center;
  }
  .start-icon { font-size: 48px; opacity: .7; }
  .start-title { font-size: 18px; font-weight: 600; color: var(--text); }
  .start-sub { font-size: 14px; color: var(--text-dim); line-height: 1.7; max-width: 300px; }
  .btn-primary {
    font-family: var(--sans); font-size: 14px; font-weight: 600;
    background: var(--agent); color: #fff; border: none;
    padding: 12px 28px; border-radius: var(--r); cursor: pointer;
    transition: background .15s, transform .1s;
  }
  .btn-primary:hover { background: var(--agent-dark); }
  .btn-primary:active { transform: scale(.97); }
  .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

  /* ── Mensajes ─────────────────────────────────────────────────────────────── */
  .messages {
    flex: 1; overflow-y: auto; padding: 20px 16px;
    display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth;
  }
  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .day-label { text-align: center; font-size: 11px; color: var(--text-xdim); font-family: var(--mono); }
  .row { display: flex; flex-direction: column; gap: 3px; }
  .row.agent  { align-items: flex-end; }
  .row.client { align-items: flex-start; }
  .row-label { font-size: 11px; color: var(--text-xdim); padding: 0 4px; }

  .bubble {
    max-width: 80%; padding: 10px 14px; font-size: 14px; line-height: 1.65;
    word-break: break-word; white-space: pre-wrap;
  }
  .row.agent .bubble {
    background: var(--agent); color: #fff;
    border-radius: var(--r) var(--r) 3px var(--r);
  }
  .row.client .bubble {
    background: var(--surface); color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--r) var(--r) var(--r) 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .bubble-time { font-size: 10px; margin-top: 3px; padding: 0 4px; color: var(--text-xdim); }

  .typing-indicator {
    display: flex; align-items: center; gap: 4px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r) var(--r) var(--r) 3px;
    padding: 12px 16px; width: fit-content;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .typing-indicator span {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--text-xdim); animation: bounce .9s ease-in-out infinite;
  }
  .typing-indicator span:nth-child(2) { animation-delay: .15s; }
  .typing-indicator span:nth-child(3) { animation-delay: .30s; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

  .error-banner {
    margin: 0 16px 8px; padding: 9px 14px; flex-shrink: 0;
    background: var(--red-bg); border: 1px solid #fecaca;
    border-radius: var(--r-sm); font-size: 13px; color: var(--red);
    display: flex; align-items: center; gap: 8px;
  }

  /* ── Input ────────────────────────────────────────────────────────────────── */
  .input-area {
    flex-shrink: 0; padding: 12px 16px 16px;
    border-top: 1px solid var(--border); background: var(--surface);
    display: flex; gap: 8px; align-items: flex-end;
  }
  textarea {
    flex: 1; font-family: var(--sans); font-size: 14px; line-height: 1.5;
    background: var(--surface2); color: var(--text);
    border: 1px solid var(--border); border-radius: 20px;
    padding: 9px 16px; resize: none; outline: none;
    transition: border-color .15s; min-height: 40px; max-height: 120px;
  }
  textarea::placeholder { color: var(--text-xdim); }
  textarea:focus { border-color: var(--agent); background: var(--surface); }
  textarea:disabled { opacity: .45; cursor: not-allowed; }

  .send-btn {
    width: 40px; height: 40px; flex-shrink: 0;
    border: none; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: var(--agent); transition: background .15s, transform .1s;
  }
  .send-btn:hover:not(:disabled) { background: var(--agent-dark); }
  .send-btn:active:not(:disabled) { transform: scale(.93); }
  .send-btn:disabled { background: var(--border); cursor: not-allowed; }
  .send-btn svg { width: 16px; height: 16px; color: #fff; }

  .input-hint {
    text-align: center; font-size: 11px; color: var(--text-xdim);
    padding: 4px 0 0; flex-shrink: 0; font-family: var(--mono);
  }

  /* ── Modal de evaluación ─────────────────────────────────────────────────── */
  .overlay {
    position: fixed; inset: 0; background: rgba(20,22,26,.55);
    display: flex; align-items: center; justify-content: center;
    z-index: 50; padding: 20px;
  }
  .eval-modal {
    background: var(--surface); border-radius: 18px;
    width: 100%; max-width: 520px; max-height: 90dvh;
    overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.25);
  }
  .eval-modal::-webkit-scrollbar { width: 4px; }
  .eval-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .eval-header {
    padding: 28px 28px 20px; text-align: center;
    background: linear-gradient(160deg, var(--agent-light) 0%, var(--surface) 100%);
    border-bottom: 1px solid var(--border); position: sticky; top: 0;
  }
  .eval-icon   { font-size: 36px; margin-bottom: 8px; }
  .eval-title  { font-size: 18px; font-weight: 700; color: var(--text); }
  .eval-total  {
    display: inline-flex; align-items: baseline; gap: 4px;
    margin-top: 12px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 12px;
    padding: 8px 20px;
  }
  .eval-score-num  { font-size: 32px; font-weight: 700; color: var(--text); font-family: var(--mono); }
  .eval-score-den  { font-size: 16px; color: var(--text-dim); }
  .eval-score-label { font-size: 12px; color: var(--text-dim); margin-top: 2px; }

  .eval-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }

  /* Criterios */
  .criteria-grid { display: flex; flex-direction: column; gap: 10px; }
  .criterion-row {
    display: flex; align-items: center; gap: 10px;
  }
  .criterion-label {
    flex: 1; font-size: 12.5px; color: var(--text); min-width: 0;
  }
  .criterion-bar-wrap {
    width: 120px; height: 7px; background: var(--border);
    border-radius: 4px; overflow: hidden; flex-shrink: 0;
  }
  .criterion-bar {
    height: 100%; border-radius: 4px;
    transition: width .6s ease-out;
  }
  .criterion-score {
    font-family: var(--mono); font-size: 12.5px; font-weight: 700;
    width: 32px; text-align: right; flex-shrink: 0;
  }

  /* Feedback */
  .feedback-card {
    border-radius: var(--r); padding: 14px 16px;
  }
  .feedback-card.positive { background: var(--green-bg); border: 1px solid #bbf7d0; }
  .feedback-card.improve  { background: var(--amber-bg); border: 1px solid #fde68a; }
  .feedback-label {
    font-size: 11.5px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .04em; margin-bottom: 6px;
  }
  .feedback-card.positive .feedback-label { color: var(--green); }
  .feedback-card.improve  .feedback-label { color: var(--amber); }
  .feedback-text { font-size: 13.5px; color: var(--text); line-height: 1.65; }

  .eval-footer { padding: 0 24px 24px; }
  .eval-footer .btn-primary { width: 100%; }

  /* Loading de evaluación */
  .eval-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 14px; padding: 60px 40px;
    text-align: center;
  }
  .eval-spinner {
    width: 36px; height: 36px;
    border: 3px solid var(--border); border-top-color: var(--agent);
    border-radius: 50%; animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .eval-loading-text { font-size: 14px; color: var(--text-dim); }
`;

function formatTime(seconds) {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getTimerClass(timeLeft) {
  if (timeLeft === null) return "";
  if (timeLeft <= 30) return "danger";
  if (timeLeft <= 60) return "warning";
  return "";
}

function getScoreColor(score) {
  if (score >= 6) return "var(--green)";
  if (score >= 4) return "var(--amber)";
  return "var(--red)";
}

function formatMsgTime(date) {
  return date?.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) ?? "";
}

export default function SoporteChat() {
  const { user, logout } = useAuth();
  const {
    messages, isTyping, error,
    sessionReady, timeLeft, timeExpired,
    evaluation, isEvaluating,
    startSession, sendMessage, resetSession, cancelRequest,
  } = useSoporteChat();

  const [input, setInput]       = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const timesRef      = useRef({});
  const prevLenRef    = useRef(0);
  const messagesEndRef = useRef(null);
  const textareaRef   = useRef(null);
  const menuRef       = useRef(null);

  useEffect(() => {
    for (let i = prevLenRef.current; i < messages.length; i++) {
      timesRef.current[i] = new Date();
    }
    prevLenRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSubmit = () => {
    if (!input.trim() || isTyping || timeExpired) return;
    sendMessage(input.trim());
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const initials = (user?.full_name || "U")
    .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const turnCount = Math.ceil(messages.length / 2);
  const showEvalModal = isEvaluating || evaluation;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Topbar de cuenta */}
        <div className="topbar" ref={menuRef}>
          <button className="account-trigger" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="account-avatar">{initials}</div>
            <span className="account-name">{user?.full_name}</span>
            <span style={{ fontSize: 9, color: "var(--text-xdim)" }}>{menuOpen ? "▲" : "▼"}</span>
          </button>
          {menuOpen && (
            <div className="account-menu">
              <div className="account-menu-header">
                <div className="account-menu-name">{user?.full_name}</div>
                <div className="account-menu-email">{user?.email}</div>
                {user?.cohort && <span className="account-menu-cohort">Cohorte {user.cohort}</span>}
              </div>
              <button className="account-menu-item" onClick={logout}>⏻ Cerrar sesión</button>
            </div>
          )}
        </div>

        {/* Header del chat */}
        <header className="header">
          <div className="avatar">😤</div>
          <div className="header-info">
            <div className="header-name">Cliente — Soporte TI</div>
            <div className="header-meta">
              <div className={`status-dot ${!sessionReady ? "offline" : isTyping ? "typing" : ""}`} />
              <span>
                {!sessionReady ? "Sin sesión activa"
                  : isTyping ? "escribiendo..."
                  : `en línea · turno ${turnCount}`}
              </span>
            </div>
          </div>
          {sessionReady && (
            <div className={`timer ${getTimerClass(timeLeft)}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
        </header>

        {/* Contenido principal */}
        {!sessionReady ? (
          <div className="start-screen">
            <div className="start-icon">🎧</div>
            <div className="start-title">Simulador de soporte TI</div>
            <div className="start-sub">
              Se te asignará un cliente con un problema técnico. Tendrás <strong>3 minutos</strong> para resolverlo. Al terminar el tiempo recibirás tu evaluación.
            </div>
            <button className="btn-primary" onClick={startSession}>
              Iniciar caso
            </button>
          </div>
        ) : (
          <>
            <div className="messages">
              {messages.length === 0 && (
                <div className="day-label">Caso iniciado — saluda al cliente para comenzar</div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`row ${msg.role === "user" ? "agent" : "client"}`}>
                  <div className="row-label">{msg.role === "user" ? "Tú" : "Cliente"}</div>
                  <div className="bubble">{msg.content}</div>
                  <div className="bubble-time">{formatMsgTime(timesRef.current[i])}</div>
                </div>
              ))}
              {isTyping && (
                <div className="row client">
                  <div className="row-label">Cliente</div>
                  <div className="typing-indicator"><span /><span /><span /></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && <div className="error-banner"><span>⚠</span> {error}</div>}

            <div className="input-area">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={timeExpired ? "Tiempo agotado — generando evaluación…" : "Escribe tu respuesta al cliente…"}
                disabled={isTyping || timeExpired}
                rows={1}
              />
              <button
                className="send-btn"
                onClick={handleSubmit}
                disabled={!input.trim() || isTyping || timeExpired}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="input-hint">Enter para enviar · Shift+Enter para nueva línea</div>
          </>
        )}
      </div>

      {/* Modal de evaluación */}
      {showEvalModal && (
        <div className="overlay">
          <div className="eval-modal">
            {isEvaluating ? (
              <div className="eval-loading">
                <div className="eval-spinner" />
                <div className="eval-loading-text">
                  Analizando tu conversación y generando retroalimentación…
                </div>
              </div>
            ) : evaluation && (
              <>
                <div className="eval-header">
                  <div className="eval-icon">📋</div>
                  <div className="eval-title">Resultado de tu práctica</div>
                  <div className="eval-total">
                    <span className="eval-score-num">{Number(evaluation.total).toFixed(1)}</span>
                    <span className="eval-score-den">/ 7</span>
                  </div>
                  <div className="eval-score-label">Puntaje total</div>
                </div>

                <div className="eval-body">
                  {/* Criterios */}
                  <div className="criteria-grid">
                    {Object.entries(evaluation.scores).map(([key, score]) => (
                      <div className="criterion-row" key={key}>
                        <div className="criterion-label">
                          {evaluation.criteria_labels?.[key] || key}
                        </div>
                        <div className="criterion-bar-wrap">
                          <div
                            className="criterion-bar"
                            style={{
                              width: `${(score / 7) * 100}%`,
                              background: getScoreColor(score),
                            }}
                          />
                        </div>
                        <div className="criterion-score" style={{ color: getScoreColor(score) }}>
                          {score}/7
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Retroalimentación */}
                  <div className="feedback-card positive">
                    <div className="feedback-label">✓ Lo que hiciste bien</div>
                    <div className="feedback-text">{evaluation.feedback_positive}</div>
                  </div>
                  <div className="feedback-card improve">
                    <div className="feedback-label">↑ Oportunidades de mejora</div>
                    <div className="feedback-text">{evaluation.feedback_improve}</div>
                  </div>
                </div>

                <div className="eval-footer">
                  <button className="btn-primary" onClick={resetSession}>
                    Iniciar un caso nuevo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}