"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("admin_token", data.token);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="https://ucarecdn.com/32afcda9-7aef-451f-a137-37de029f8cf5/-/format/auto/"
            alt="Scene Logo"
            className="w-24 h-24 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-white/60">Manage events, users, and pop-ups</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#1A1A1A] rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-white text-sm font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#222222] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]"
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-white text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#222222] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF5E5B] text-white font-bold py-3 rounded-lg hover:bg-[#FF5E5B]/90 disabled:bg-gray-600 transition"
          >
            {loading ? "Logging in..." : "Login to Admin"}
          </button>
        </form>

        <p className="text-white/40 text-xs text-center mt-6">
          To create your first admin account, use the API: POST
          /api/admin/create
        </p>
      </div>
    </div>
  );
}
