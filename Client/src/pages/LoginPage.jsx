import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name || !password) {
      setError("Please enter your name and password.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const result =
      mode === "login" ? await login(name, password) : await register(name, password);
    setLoading(false);

    if (result.success) {
      navigate("/teacher/dashboard");
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-900 to-indigo-800 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg shadow-indigo-500/30">
            EC
          </div>
          <h1 className="text-white text-lg font-semibold">EduChain360</h1>
          <p className="text-indigo-100 text-sm">Teacher Portal</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-2xl p-6"
        >
          <h2 className="text-navy-900 text-lg font-semibold mb-1">
            {mode === "login" ? "Sign in to continue" : "Create your account"}
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            {mode === "login"
              ? "Use your teacher account credentials."
              : "Set up a login for your teacher account."}
          </p>

          {error && (
            <div className="mb-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <label className="block text-sm text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Anita Mahara"
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600/40"
          />

          <label className="block text-sm text-gray-600 mb-1">Password</label>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {mode === "register" && (
            <>
              <label className="block text-sm text-gray-600 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600/40"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-60 mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            {mode === "login" ? (
              <>
                New teacher?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-indigo-700 font-medium hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-indigo-700 font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>

        <p className="text-xs text-white/30 mt-6 text-center">
          © 2026 EduChain360 · Far Western University
        </p>
      </div>
    </div>
  );
}