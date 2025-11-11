import { useState } from "react";
import { apiFetch } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      if (res?.token) {
        // login to set context and redirect
        await login(email, password);
        showToast({ type: "success", message: "Account created" });
      } else {
        setError(res?.message || "Registration failed");
        showToast({
          type: "error",
          message: res?.message || "Registration failed",
        });
      }
    } catch {
      setError("Registration failed");
      showToast({ type: "error", message: "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="relative max-w-md w-full">
        {/* decorative bubbles */}
        <div className="absolute -top-8 -left-8 w-36 h-36 bg-gradient-to-br from-primary/60 to-accent/40 rounded-full blur-3xl opacity-80 animate-float" />
        <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-gradient-to-br from-accent/50 to-primary/30 rounded-full blur-3xl opacity-70 animate-float" />

        <form
          onSubmit={submit}
          className="relative bg-slate-800/80 backdrop-blur-sm border border-white/6 shadow-xl rounded-3xl p-8 z-10"
        >
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Create an account
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            Join as a reporter to post news.
          </p>

          <input
            className="w-full p-3 rounded-xl mb-3 bg-slate-700/60 border border-white/6 text-white placeholder:text-slate-300"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-xl mb-3 bg-slate-700/60 border border-white/6 text-white placeholder:text-slate-300"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 rounded-xl mb-3 bg-slate-700/60 border border-white/6 text-white placeholder:text-slate-300"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="text-sm text-rose-400 mb-2">{error}</div>}

          <button
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg hover:scale-[1.01] transition-transform"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <div className="mt-4 text-center text-sm text-slate-300">
            Already have an account?{" "}
            <a href="/login" className="text-white font-medium">
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
