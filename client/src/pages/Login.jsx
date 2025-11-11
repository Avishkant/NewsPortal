import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { motion } from "framer-motion";
import { FaSignInAlt, FaUserEdit } from "react-icons/fa";

// --- Custom Styled Input Component (Light Theme) ---
const StyledInput = ({ className = "", ...props }) => (
  <input
    // Background: White, Border: Light Gray, Text: Black/Dark Gray
    className={`w-full p-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-gray-800 focus:border-gray-800 focus:outline-none transition duration-300 ${className}`}
    {...props}
  />
);

export default function Login() {
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

    const res = await login(email, password);

    if (!res.ok) {
      const errMsg = res.error || "Invalid credentials. Please try again.";
      setError(errMsg);
      showToast({ type: "error", message: errMsg });
    } else {
      showToast({
        type: "success",
        message: "Signed in successfully! Redirecting...",
      });
    }
    setLoading(false);
  };

  return (
    // FIX APPLIED: Set entire container background to light gray/white
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        className="relative max-w-md w-full"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {/* Animated Background Blob (Using lighter accent colors) */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-200/60 rounded-full blur-3xl opacity-80 animate-float" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-200/60 rounded-full blur-3xl opacity-80 animate-float-delay-2000" />

        {/* Form Container: White/Light Background */}
        <motion.form
          onSubmit={submit}
          className="relative bg-white border border-gray-200 shadow-2xl rounded-3xl p-10 z-10 space-y-4"
          whileHover={{
            boxShadow:
              "0 0 40px rgba(0, 0, 0, 0.1), 0 0 10px rgba(147, 51, 234, 0.1)",
          }}
        >
          <header className="text-center mb-6">
            <FaUserEdit className="w-8 h-8 mx-auto mb-2 text-gray-700" />
            <h2 className="text-3xl font-extrabold text-gray-800">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to manage your news content.
            </p>
          </header>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-700">Email</span>
            <StyledInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-700">
              Password
            </span>
            <StyledInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </label>

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 p-2 bg-red-50 rounded-lg border border-red-300"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            disabled={loading}
            type="submit"
            // Button: Dark text on deep gray/black background
            className="w-full py-3 rounded-xl bg-gray-800 text-white font-extrabold shadow-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaSignInAlt /> {loading ? "Authenticating..." : "Sign In"}
          </motion.button>

          <div className="mt-4 text-center text-sm text-gray-600 pt-2 border-t border-gray-200">
            Don't have an account?{" "}
            <motion.a
              href="/signup"
              className="text-gray-800 font-semibold hover:text-gray-900 transition"
              whileHover={{ scale: 1.05 }}
            >
              Create one
            </motion.a>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
