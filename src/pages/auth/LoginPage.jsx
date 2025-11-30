// IMPORTANT: Replace your entire LoginPage.jsx with this fixed version

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkGoogleAccountFromURL = async () => {
      const params = new URLSearchParams(location.search);
      const emailFromURL = params.get("email");
      if (!emailFromURL) return;

      try {
        const res = await fetch(`${API_URL}/api/auth/check-google?email=${encodeURIComponent(emailFromURL)}`);
        const data = await res.json();
        if (data.isGoogleOnly) {
          setError("This account uses Google Sign-In. Please use the Google button below.");
          setEmail(emailFromURL);
        }
      } catch (err) {
        console.error("Failed to check Google account:", err);
      }
    };

    checkGoogleAccountFromURL();
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") navigate("/admin-dashboard");
      else navigate("/user-dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError("Google login failed. Please try again.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") navigate("/admin-dashboard");
      else navigate("/user-dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-maroon via-[#600000] to-maroon relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/20 to-black/40"></div>

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md border-4 border-gold">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-maroon mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-gray-600 text-sm">Sign in to continue your study journey</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              WMSU Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@wmsu.edu.ph"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-maroon transition"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-maroon focus:ring-gold" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <a href="/forgot-password" className="text-maroon hover:text-gold font-semibold transition">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-maroon to-[#600000] text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Sign In
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-500 text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <p className="text-center text-gray-600 text-sm">
          Don't have an account?{" "}
          <a href="/create-account" className="text-maroon hover:text-gold font-bold transition">
            Create Account
          </a>
        </p>
      </div>
    </div>
  );
}