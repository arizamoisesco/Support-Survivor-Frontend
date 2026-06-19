// useAuth.js
// Maneja login, logout y sesión del usuario con Supabase

import { useState, useEffect, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // perfil completo (role, cohort, etc)
  const [session, setSession] = useState(null);   // sesión Supabase (contiene el JWT)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recuperar sesión existente al cargar la app (si el usuario ya había iniciado sesión)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Escuchar cambios: login, logout, expiración de token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setUser(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error) setUser(data);
    setLoading(false);
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  // Token JWT para enviarlo al backend FastAPI en el header Authorization
  function getToken() {
    return session?.access_token ?? null;
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { supabase };