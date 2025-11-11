import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const login = async (email, password) => {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    if (res?.token) {
      setToken(res.token);
      setUser(res.user);
      // redirect based on role
      if (res.user.role === "owner") navigate("/owner");
      else navigate("/reporter");
      return { ok: true };
    }
    return { ok: false, error: res };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  // Read token from localStorage at call time to avoid stale closure values
  const authFetch = (path, opts = {}) => {
    const currentToken = token || localStorage.getItem("token");
    return apiFetch(path, { ...opts, token: currentToken });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
