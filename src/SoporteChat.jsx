/* SoporteChat.jsx
   Simulador de soporte TI — especialista (humano) vs cliente frustrado (IA)
   Estética: panel de helpdesk corporativo, limpio y funcional

   NUEVO: botón "Cerrar caso" en el header del chat que llama a
   completeSession(), revela quién era el cliente en un modal,
   y luego permite iniciar un caso nuevo.

   - Botón "Cerrar caso": termina la práctica actual y revela el escenario
   - Menú de cuenta (esquina superior derecha): cerrar sesión de la cuenta
*/

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useSoporteChat } from "./useSoporteChat";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #f4f5f7;
    --surface:     #ffffff;
    --surface2:    #f8f9fa;
    --border:      #e1e4e8;
    --border2:     #d0d4db;
    --text:        #1c1e21;
    --text-dim:    #6b7280;
    --text-xdim:   #9ca3af;
    --agent:       #2563eb;
    --agent-light: #eff6ff;
    --agent-dark:  #1d4ed8;
    --client:      #ffffff;
    --online:      #16a34a;
    --red:         #dc2626;
    --red-bg:      #fef2f2;
    --yellow:      #d97706;
    --mono:        'JetBrains Mono', monospace;
    --sans:        'Inter', sans-serif;
    --r:           12px;
    --r-sm:        8px;
  }

  body { background: var(--bg); font-family: var(--sans); }

  .app {
    display: flex; flex-direction: column; height: 100dvh;
    max-width: 720px; margin: 0 auto;
    background: var(--surface);
    box-shadow: 0 0 0 1px var(--border);
  }

  /* ── Topbar de cuenta ───────────────────────────────────────────────────── */
  .topbar {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 8px 16px; gap: 8px;
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0; position: relative;
  }
  .account-trigger {
    display: flex; align-items: center; gap: 8px;
    background: none; border: none; cursor: pointer;
    padding: 4px 8px; border-radius: var(--r-sm);
    transition: background .15s;
  }
  .account-trigger:hover { background: var(--surface); }
  .account-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--surface); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: var(--text-dim);
    flex-shrink: 0;
  }
  .account-name { font-size: 12.5px; font-weight: 500; color: var(--text); }
  .account-chevron { font-size: 9px; color: var(--text-xdim); }

  .account-menu {
    position: absolute; top: 42px; right: 16px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r); box-shadow: 0 8px 28px rgba(0,0,0,.12);
    min-width: 200px; z-index: 40;
    overflow: hidden;
  }
  .account-menu-header {
    padding: 12px 14px; border-bottom: 1px solid var(--border);
  }
  .account-menu-name { font-size: 13px; font-weight: 600; color: var(--text); }
  .account-menu-email { font-size: 11.5px; color: var(--text-dim); margin-top: 2px; font-family: var(--mono); }
  .account-menu-cohort {
    display: inline-block; margin-top: 6px;
    font-size: 10.5px; font-weight: 600; font-family: var(--mono);
    color: var(--agent-dark); background: var(--agent-light);
    padding: 1px 8px; border-radius: 20px;
  }
  .account-menu-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; text-align: left;
    padding: 10px 14px; font-size: 13px; font-weight: 500;
    color: var(--red); background: none; border: none; cursor: pointer;
    transition: background .15s;
  }
  .account-menu-item:hover { background: var(--red-bg); }

  /* ── Header del chat ────────────────────────────────────────────────────── */
  .header {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: #fef9c3; border: 1.5px solid #fde047;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .header-info { flex: 1; min-width: 0; }
  .header-name { font-size: 14px; font-weight: 600; color: var(--text); }
  .header-meta {
    display: flex; align-items: center; gap: 6px;
    margin-top: 2px; font-size: 12px; color: var(--text-dim);
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--online); flex-shrink: 0;
  }
  .status-dot.typing { background: var(--text-xdim); animation: blink 1s ease-in-out infinite; }
  .status-dot.offline { background: var(--border2); }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

  .ticket-tag {
    font-family: var(--mono); font-size: 11px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text-dim); padding: 2px 8px; border-radius: 4px;
    white-space: nowrap;
  }

  .btn-close-case {
    font-family: var(--sans); font-size: 12px; font-weight: 600;
    color: var(--agent); background: var(--agent-light);
    border: 1px solid #bfdbfe; border-radius: var(--r-sm);
    padding: 5px 12px; cursor: pointer;
    transition: background .15s, border-color .15s;
    white-space: nowrap;
  }
  .btn-close-case:hover:not(:disabled) { background: #dbeafe; border-color: var(--agent); }
  .btn-close-case:disabled { opacity: .4; cursor: not-allowed; }

  /* ── Estado vacío / pantalla de inicio ──────────────────────────────────── */
  .start-screen {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 20px;
    padding: 40px; text-align: center;
  }
  .start-icon { font-size: 48px; opacity: .7; }
  .start-title { font-size: 18px; font-weight: 600; color: var(--text); }
  .start-sub {
    font-size: 14px; color: var(--text-dim);
    line-height: 1.7; max-width: 300px;
  }
  .btn-primary {
    font-family: var(--sans); font-size: 14px; font-weight: 600;
    background: var(--agent); color: #fff; border: none;
    padding: 12px 28px; border-radius: var(--r); cursor: pointer;
    transition: background .15s, transform .1s;
  }
  .btn-primary:hover { background: var(--agent-dark); }
  .btn-primary:active { transform: scale(.97); }

  /* ── Área de mensajes ────────────────────────────────────────────────────── */
  .messages {
    flex: 1; overflow-y: auto; padding: 20px 16px;
    display: flex; flex-direction: column; gap: 16px;
    scroll-behavior: smooth;
  }
  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .day-label {
    text-align: center; font-size: 11px; color: var(--text-xdim);
    font-family: var(--mono); margin: 4px 0;
  }

  .row { display: flex; flex-direction: column; gap: 3px; }
  .row.agent  { align-items: flex-end; }
  .row.client { align-items: flex-start; }

  .row-label { font-size: 11px; color: var(--text-xdim); padding: 0 4px; }

  .bubble {
    max-width: 80%; padding: 10px 14px;
    font-size: 14px; line-height: 1.65;
    word-break: break-word; white-space: pre-wrap;
    position: relative;
  }

  .row.agent .bubble {
    background: var(--agent); color: #fff;
    border-radius: var(--r) var(--r) 3px var(--r);
  }

  .row.client .bubble {
    background: var(--client); color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--r) var(--r) var(--r) 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }

  .bubble-time { font-size: 10px; margin-top: 4px; padding: 0 4px; color: var(--text-xdim); }

  .typing-indicator {
    display: flex; align-items: center; gap: 4px;
    background: var(--client); border: 1px solid var(--border);
    border-radius: var(--r) var(--r) var(--r) 3px;
    padding: 12px 16px; width: fit-content;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    animation: fadeUp .2s ease-out;
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
  .typing-indicator span {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--text-xdim);
    animation: bounce .9s ease-in-out infinite;
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

  /* ── Input ───────────────────────────────────────────────────────────────── */
  .input-area {
    flex-shrink: 0; padding: 12px 16px 16px;
    border-top: 1px solid var(--border);
    background: var(--surface);
    display: flex; gap: 8px; align-items: flex-end;
  }
  textarea {
    flex: 1; font-family: var(--sans); font-size: 14px; line-height: 1.5;
    background: var(--surface2); color: var(--text);
    border: 1px solid var(--border); border-radius: 20px;
    padding: 9px 16px; resize: none; outline: none;
    transition: border-color .15s;
    min-height: 40px; max-height: 120px;
  }
  textarea::placeholder { color: var(--text-xdim); }
  textarea:focus { border-color: var(--agent); background: var(--surface); }
  textarea:disabled { opacity: .45; cursor: not-allowed; }

  .send-btn {
    width: 40px; height: 40px; flex-shrink: 0;
    border: none; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s, transform .1s;
    background: var(--agent);
  }
  .send-btn:hover:not(:disabled) { background: var(--agent-dark); }
  .send-btn:active:not(:disabled) { transform: scale(.93); }
  .send-btn:disabled { background: var(--border); cursor: not-allowed; }
  .send-btn.stop { background: #fee2e2; }
  .send-btn.stop svg { color: var(--red); }
  .send-btn svg { width: 16px; height: 16px; color: #fff; }

  .input-hint {
    text-align: center; font-size: 11px; color: var(--text-xdim);
    padding: 4px 0 0; flex-shrink: 0;
    font-family: var(--mono);
  }

  /* ── Modal de revelación ─────────────────────────────────────────────────── */
  .overlay {
    position: fixed; inset: 0; background: rgba(20,22,26,.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 50; padding: 20px;
  }
  .reveal-modal {
    background: var(--surface); border-radius: 18px;
    width: 100%; max-width: 400px;
    box-shadow: 0 16px 56px rgba(0,0,0,.22);
    overflow: hidden;
  }
  .reveal-header {
    padding: 28px 28px 20px; text-align: center;
    background: linear-gradient(180deg, var(--agent-light), var(--surface));
  }
  .reveal-icon { font-size: 40px; margin-bottom: 10px; }
  .reveal-title { font-size: 17px; font-weight: 700; color: var(--text); }
  .reveal-sub { font-size: 13px; color: var(--text-dim); margin-top: 3px; }

  .reveal-body { padding: 4px 24px 24px; }
  .reveal-field { padding: 12px 0; border-bottom: 1px solid var(--border); }
  .reveal-field:last-child { border-bottom: none; }
  .reveal-label {
    font-size: 11px; font-weight: 600; color: var(--text-xdim);
    text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px;
  }
  .reveal-value { font-size: 14px; color: var(--text); line-height: 1.5; }
  .reveal-value.tag {
    display: inline-block; font-family: var(--mono); font-size: 11.5px;
    font-weight: 600; background: var(--agent-light); color: var(--agent-dark);
    padding: 2px 10px; border-radius: 20px;
  }

  .reveal-footer { padding: 0 24px 24px; }
  .reveal-footer .btn-primary { width: 100%; }
`;

function formatTime(date) {
  return date?.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) ?? "";
}

export default function SoporteChat() {
  const { user, logout } = useAuth();
  const {
    messages, isTyping, error,
    sessionReady, startSession,
    sendMessage, completeSession, cancelRequest, resetSession,
  } = useSoporteChat();

  const [input, setInput]         = useState("");
  const [closing, setClosing]     = useState(false);
  const [reveal, setReveal]       = useState(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const timesRef            = useRef({});
  const prevLenRef          = useRef(0);
  const messagesEndRef      = useRef(null);
  const textareaRef         = useRef(null);
  const menuRef             = useRef(null);

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

  // Cerrar el menú de cuenta al hacer clic fuera de él
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSubmit = () => {
    if (!input.trim() || isTyping) return;
    sendMessage(input.trim());
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCloseCase = async () => {
    setClosing(true);
    const revealed = await completeSession();
    setClosing(false);
    setReveal(revealed || { error: true });
  };

  const handleStartNewCase = () => {
    setReveal(null);
    resetSession();
  };

  const turnCount = Math.ceil(messages.length / 2);
  const hasMessages = messages.length > 0;

  const initials = (user?.full_name || "U")
    .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Topbar de cuenta — siempre visible, independiente del estado del caso */}
        <div className="topbar" ref={menuRef}>
          <button className="account-trigger" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="account-avatar">{initials}</div>
            <span className="account-name">{user?.full_name}</span>
            <span className="account-chevron">{menuOpen ? "▲" : "▼"}</span>
          </button>

          {menuOpen && (
            <div className="account-menu">
              <div className="account-menu-header">
                <div className="account-menu-name">{user?.full_name}</div>
                <div className="account-menu-email">{user?.email}</div>
                {user?.cohort && (
                  <span className="account-menu-cohort">Cohorte {user.cohort}</span>
                )}
              </div>
              <button className="account-menu-item" onClick={logout}>
                ⏻ Cerrar sesión
              </button>
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
                {!sessionReady
                  ? "Sin sesión activa"
                  : isTyping
                  ? "escribiendo..."
                  : `en línea · turno ${turnCount}`}
              </span>
            </div>
          </div>
          {sessionReady && (
            <span className="ticket-tag">SIM-{String(turnCount).padStart(3, "0")}</span>
          )}
          {sessionReady && (
            <button
              className="btn-close-case"
              onClick={handleCloseCase}
              disabled={isTyping || closing || !hasMessages}
              title={!hasMessages ? "Escribe al menos un mensaje antes de cerrar" : "Cerrar caso y ver el resultado"}
            >
              {closing ? "Cerrando…" : "✓ Cerrar caso"}
            </button>
          )}
        </header>

        {!sessionReady ? (
          <div className="start-screen">
            <div className="start-icon">🎧</div>
            <div className="start-title">Simulador de soporte TI</div>
            <div className="start-sub">
              Se te asignará un cliente con un problema técnico. No sabrás quién es ni qué le pasa hasta que cierres el caso.
            </div>
            <button className="btn-primary" onClick={startSession}>
              Iniciar caso
            </button>
          </div>
        ) : (
          <>
            <div className="messages">
              {messages.length === 0 && (
                <div className="day-label">
                  Caso iniciado — saluda al cliente para comenzar
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`row ${msg.role === "user" ? "agent" : "client"}`}>
                  <div className="row-label">
                    {msg.role === "user" ? "Tú" : "Cliente"}
                  </div>
                  <div className="bubble">{msg.content}</div>
                  <div className="bubble-time">{formatTime(timesRef.current[i])}</div>
                </div>
              ))}

              {isTyping && (
                <div className="row client">
                  <div className="row-label">Cliente</div>
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="error-banner">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="input-area">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu respuesta al cliente…"
                disabled={isTyping}
                rows={1}
              />
              <button
                className={`send-btn ${isTyping ? "stop" : ""}`}
                onClick={isTyping ? cancelRequest : handleSubmit}
                disabled={!isTyping && !input.trim()}
                title={isTyping ? "Cancelar" : "Enviar"}
              >
                {isTyping ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
            <div className="input-hint">Enter para enviar · Shift+Enter para nueva línea</div>
          </>
        )}

      </div>

      {reveal && (
        <div className="overlay">
          <div className="reveal-modal">
            {reveal.error ? (
              <>
                <div className="reveal-header">
                  <div className="reveal-icon">⚠</div>
                  <div className="reveal-title">No se pudo cerrar el caso</div>
                  <div className="reveal-sub">Intenta de nuevo en unos segundos.</div>
                </div>
                <div className="reveal-footer">
                  <button className="btn-primary" onClick={() => setReveal(null)}>
                    Volver al chat
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="reveal-header">
                  <div className="reveal-icon">✅</div>
                  <div className="reveal-title">Caso cerrado</div>
                  <div className="reveal-sub">Esto es lo que estabas enfrentando</div>
                </div>
                <div className="reveal-body">
                  <div className="reveal-field">
                    <div className="reveal-label">Cliente</div>
                    <div className="reveal-value">{reveal.client_name || "—"}</div>
                  </div>
                  <div className="reveal-field">
                    <div className="reveal-label">Incidente</div>
                    <div className="reveal-value">{reveal.incident || "—"}</div>
                    {reveal.category && (
                      <div className="reveal-value tag" style={{ marginTop: 6 }}>
                        {reveal.category}
                      </div>
                    )}
                  </div>
                  <div className="reveal-field">
                    <div className="reveal-label">Personalidad</div>
                    <div className="reveal-value tag">{reveal.personality || "—"}</div>
                  </div>
                </div>
                <div className="reveal-footer">
                  <button className="btn-primary" onClick={handleStartNewCase}>
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