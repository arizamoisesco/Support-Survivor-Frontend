// useSoporteChat.js — con autenticación y session_id

import { useState, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function useSoporteChat() {
  const { getToken } = useAuth();

  const [messages,     setMessages]     = useState([]);
  const [isTyping,     setIsTyping]     = useState(false);
  const [error,        setError]        = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Refs — sincrónicas, no tienen el problema de stale state
  const historyRef   = useRef([]);   // historial completo para mandar al backend
  const systemRef    = useRef(null); // system prompt — guardado en ref, nunca mostrado en UI
  const sessionIdRef = useRef(null); // id de la sesión activa en Supabase
  const abortRef     = useRef(null);

  // Headers con JWT para cada request al backend
  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`,
  }), [getToken]);

  // ── Iniciar sesión de práctica ─────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/session/new`, {
        method:  "POST",
        headers: authHeaders(),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `Error ${res.status}`);
      }

      const data = await res.json();

      sessionIdRef.current = data.session_id;
      systemRef.current    = data.system;     // system prompt — el learner nunca lo ve
      historyRef.current   = [];
      setMessages([]);
      setSessionReady(true);

    } catch (err) {
      setError(err.message || "No se pudo iniciar el caso. Intenta de nuevo.");
    }
  }, [authHeaders]);

  // ── Enviar mensaje del especialista ───────────────────────────────────────
  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isTyping) return;
    setError(null);

    // 1. Agregar mensaje a la ref y al estado visual inmediatamente
    const userMsg = { role: "user", content: userText };
    historyRef.current = [...historyRef.current, userMsg];
    setMessages([...historyRef.current]);
    setIsTyping(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method:  "POST",
        headers: authHeaders(),
        signal:  controller.signal,
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          messages:   historyRef.current,   // historial completo siempre actualizado
          system:     systemRef.current,
        }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `Error ${res.status}`);
      }

      const data = await res.json();

      // 2. Agregar respuesta del cliente-IA
      const assistantMsg = { role: "assistant", content: data.message };
      historyRef.current = [...historyRef.current, assistantMsg];
      setMessages([...historyRef.current]);

    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Error al contactar la API");
      // Revertir el mensaje del usuario si hubo error
      historyRef.current = historyRef.current.slice(0, -1);
      setMessages([...historyRef.current]);
    } finally {
      setIsTyping(false);
      abortRef.current = null;
    }
  }, [isTyping, authHeaders]);

  // ── Completar sesión — revela el escenario al learner ─────────────────────
  const completeSession = useCallback(async () => {
    if (!sessionIdRef.current) return null;
    try {
      const res = await fetch(`${API_URL}/session/${sessionIdRef.current}/complete`, {
        method:  "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      return data.revealed; // { client_name, incident, category, personality }
    } catch {
      return null;
    }
  }, [authHeaders]);

  // ── Cancelar request en vuelo ──────────────────────────────────────────────
  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    setIsTyping(false);
  }, []);

  // ── Reiniciar completamente ────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    abortRef.current?.abort();
    historyRef.current   = [];
    systemRef.current    = null;
    sessionIdRef.current = null;
    setMessages([]);
    setSessionReady(false);
    setError(null);
    setIsTyping(false);
  }, []);

  return {
    messages,
    isTyping,
    error,
    sessionReady,
    startSession,
    sendMessage,
    completeSession,
    cancelRequest,
    resetSession,
  };
}