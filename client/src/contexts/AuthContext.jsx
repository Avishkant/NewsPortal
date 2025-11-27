import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

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
    try {
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
    } catch (err) {
      // apiFetch throws on non-2xx responses; normalize the error for callers
      const message = err?.message || "Authentication failed";
      return { ok: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const promptLogout = () => setShowLogoutConfirm(true);

  const handleConfirmLogout = () => {
    try {
      logout();
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  const handleCancelLogout = () => setShowLogoutConfirm(false);

  // Read token from localStorage at call time to avoid stale closure values
  const authFetch = (path, opts = {}) => {
    const currentToken = token || localStorage.getItem("token");
    return apiFetch(path, { ...opts, token: currentToken });
  };

  // Refresh current user from server (returns user or null)
  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) return null;
    try {
      const me = await apiFetch("/api/auth/me", { token: currentToken });
      setUser(me);
      return me;
    } catch (err) {
      console.warn("refreshUser failed", err?.message || err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        authFetch,
        promptLogout,
        refreshUser,
      }}
    >
      {children}
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
