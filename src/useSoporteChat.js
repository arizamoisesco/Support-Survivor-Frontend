// useSoporteChat.js — con autenticación y session_id
// useSoporteChat.js — con timer y evaluación automática al terminar

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function useSoporteChat() {
  const { getToken } = useAuth();

  const [messages,      setMessages]      = useState([]);
  const [isTyping,      setIsTyping]      = useState(false);
  const [error,         setError]         = useState(null);
  const [sessionReady,  setSessionReady]  = useState(false);
  const [timeLeft,      setTimeLeft]      = useState(null);   // segundos restantes
  const [timeExpired,   setTimeExpired]   = useState(false);  // true cuando llegó a 0
  const [evaluation,    setEvaluation]    = useState(null);   // resultado de la evaluación
  const [isEvaluating,  setIsEvaluating]  = useState(false);  // cargando evaluación

  const historyRef    = useRef([]);
  const systemRef     = useRef(null);
  const sessionIdRef  = useRef(null);
  const timerRef      = useRef(null);       // intervalo del countdown
  const startTimeRef  = useRef(null);       // cuando empezó la sesión
  const abortRef      = useRef(null);

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getTokenRef.current()}`,
  }), []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = useCallback((seconds) => {
    setTimeLeft(seconds);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Cuando expira el tiempo, disparar evaluación automáticamente ───────────
  useEffect(() => {
    if (!timeExpired) return;
    handleEvaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeExpired]);

  // ── Iniciar sesión ─────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setError(null);
    setEvaluation(null);
    setTimeExpired(false);
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
      systemRef.current    = data.system;
      historyRef.current   = [];
      setMessages([]);
      setSessionReady(true);
      startTimer(data.timer_seconds || 180);
    } catch (err) {
      setError(err.message || "No se pudo iniciar el caso.");
    }
  }, [authHeaders, startTimer]);

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isTyping || timeExpired) return;
    setError(null);

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
          messages:   historyRef.current,
          system:     systemRef.current,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      const assistantMsg = { role: "assistant", content: data.message };
      historyRef.current = [...historyRef.current, assistantMsg];
      setMessages([...historyRef.current]);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
      historyRef.current = historyRef.current.slice(0, -1);
      setMessages([...historyRef.current]);
    } finally {
      setIsTyping(false);
      abortRef.current = null;
    }
  }, [isTyping, timeExpired, authHeaders]);

  // ── Evaluar la sesión ──────────────────────────────────────────────────────
  const handleEvaluate = useCallback(async () => {
    stopTimer();
    setIsTyping(false);
    abortRef.current?.abort();
    setIsEvaluating(true);

    const durationSeconds = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 180;

    try {
      const res = await fetch(`${API_URL}/session/evaluate`, {
        method:  "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          session_id:       sessionIdRef.current,
          messages:         historyRef.current,
          duration_seconds: durationSeconds,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      setError("No se pudo generar la evaluación: " + err.message);
    } finally {
      setIsEvaluating(false);
    }
  }, [authHeaders, stopTimer]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    stopTimer();
    abortRef.current?.abort();
    historyRef.current  = [];
    systemRef.current   = null;
    sessionIdRef.current = null;
    startTimeRef.current = null;
    setMessages([]);
    setSessionReady(false);
    setTimeLeft(null);
    setTimeExpired(false);
    setEvaluation(null);
    setIsEvaluating(false);
    setError(null);
    setIsTyping(false);
  }, [stopTimer]);

  return {
    messages, isTyping, error,
    sessionReady, timeLeft, timeExpired,
    evaluation, isEvaluating,
    startSession, sendMessage, resetSession,
    cancelRequest: () => { abortRef.current?.abort(); setIsTyping(false); },
  };
}