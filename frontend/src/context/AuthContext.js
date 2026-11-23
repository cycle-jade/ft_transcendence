import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { endpoints } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from existing token
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { setLoading(false); return; }
    api.get(endpoints.users.me)
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Register: single step → token immediately
   */
  const register = useCallback(async (form) => {
    const res = await api.post(endpoints.auth.register, form);
    localStorage.setItem("token", res.data.accessToken);
    const me = await api.get(endpoints.users.me);
    setUser(me.data);
    // Auto-create a profile for new users (profile creation is not automatic on backend)
    try {
      await api.post(endpoints.profiles.createMine, { displayName: form.nickname });
    } catch {
      // Profile may already exist or creation failed — not fatal
    }
    return me.data;
  }, []);

  /**
   * Login step 1: send nickname + password
   * Returns { requiresTwoFactor, verificationId, expiresInSeconds }
   * If requiresTwoFactor is true, caller must show the code input and call verifyCode()
   */
  const loginStep1 = useCallback(async (nickname, password) => {
    const res = await api.post(endpoints.auth.loginByNickname, { nickname, password });
    return res.data; // { requiresTwoFactor, verificationId, expiresInSeconds }
  }, []);

  /**
   * Login step 2: exchange verificationId + email code for the real token
   */
  const verifyCode = useCallback(async (verificationId, code) => {
    const res = await api.post(endpoints.auth.verifyEmailCode, { verificationId, code });
    localStorage.setItem("token", res.data.accessToken);
    const me = await api.get(endpoints.users.me);
    setUser(me.data);
    return me.data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post(endpoints.users.markOffline); } catch {}
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, loginStep1, verifyCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
