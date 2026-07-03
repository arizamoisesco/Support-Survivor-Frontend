// useAdminApi.js
// Centraliza todas las llamadas a los endpoints /admin/* del backend
//
// FIX: antes este hook devolvía un objeto nuevo en cada render,
// lo que provocaba que cualquier useCallback/useEffect que dependiera
// de él se re-disparara sin parar (loop infinito de requests).
// Ahora usamos useRef para mantener getToken() siempre actualizado
// sin que el objeto `api` cambie de identidad entre renders.

import { useCallback, useRef, useMemo } from "react";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function useAdminApi() {
  const { getToken } = useAuth();

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const request = useCallback(async (path, options = {}) => {
    const token = getTokenRef.current();
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: options.isFormData
        ? { "Authorization": `Bearer ${token}` }
        : { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail?.detail || `Error ${res.status}`);
    }
    return res.json();
  }, []);

  // Descarga de archivos binarios (Excel) — dispara la descarga directamente en el navegador
  const downloadFile = useCallback(async (path, filename) => {
    const token = getTokenRef.current();
    const res = await fetch(`${API_URL}${path}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail?.detail || `Error ${res.status}`);
    }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return useMemo(() => ({
    // ── Learners ──────────────────────────────────────────────────────────────
    listLearners: () => request("/admin/learners"),
    createLearner: (data) => request("/admin/learners", {
      method: "POST", body: JSON.stringify(data),
    }),
    updateLearner: (id, updates) => request(`/admin/learners/${id}`, {
      method: "PATCH", body: JSON.stringify(updates),
    }),
    bulkCreateLearners: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return request("/admin/learners/bulk", {
        method: "POST", body: formData, isFormData: true,
      });
    },
    downloadLearnersTemplate: () =>
      downloadFile("/admin/learners/template", "plantilla_learners.xlsx"),

    // ── Catálogo: nombres ─────────────────────────────────────────────────────
    listNames: () => request("/admin/catalog/names"),
    addName: (name) => request("/admin/catalog/names", {
      method: "POST", body: JSON.stringify({ name }),
    }),
    toggleName: (id, active) => request(`/admin/catalog/names/${id}`, {
      method: "PATCH", body: JSON.stringify({ active }),
    }),

    // ── Catálogo: incidentes ──────────────────────────────────────────────────
    listIncidents: () => request("/admin/catalog/incidents"),
    addIncident: (description, category) => request("/admin/catalog/incidents", {
      method: "POST", body: JSON.stringify({ description, category }),
    }),
    toggleIncident: (id, active) => request(`/admin/catalog/incidents/${id}`, {
      method: "PATCH", body: JSON.stringify({ active }),
    }),

    // ── Catálogo: personalidades ──────────────────────────────────────────────
    listPersonalities: () => request("/admin/catalog/personalities"),
    addPersonality: (name, description) => request("/admin/catalog/personalities", {
      method: "POST", body: JSON.stringify({ name, description }),
    }),
    togglePersonality: (id, active) => request(`/admin/catalog/personalities/${id}`, {
      method: "PATCH", body: JSON.stringify({ active }),
    }),

    // ── Sesiones / reportes ───────────────────────────────────────────────────
    listSessions: () => request("/admin/sessions"),
  }), [request, downloadFile]);
}