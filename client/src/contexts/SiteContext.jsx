import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import { useAuth } from "./AuthContext.jsx";

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const { authFetch } = useAuth() || {};
  const [site, setSite] = useState(null);

  const load = async () => {
    try {
      const data = await apiFetch("/api/site");
      setSite(data || {});
    } catch {
      setSite({});
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateSite = async (payload) => {
    if (!authFetch) return null;
    try {
      const res = await authFetch("/api/site", {
        method: "PUT",
        body: payload,
      });
      if (res) setSite(res);
      return res;
    } catch (err) {
      throw err;
    }
  };

  return (
    <SiteContext.Provider value={{ site, setSite, load, updateSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within SiteProvider");
  return ctx;
}

export default SiteContext;
