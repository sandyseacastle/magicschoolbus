"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/teacher");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background dotted-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-fun-yellow flex items-center justify-center border-[3px] border-border"
            style={{ boxShadow: "4px 4px 0 #334155" }}
          >
            <span className="text-4xl">&#127758;</span>
          </div>
          <h1 className="text-3xl font-bold">VR Excursions</h1>
          <p className="text-muted mt-1">Teacher Portal</p>
        </div>

        <div className="sticker-card p-6">
          <div className="flex gap-1 bg-surface-alt rounded-xl p-1 border-2 border-border mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                mode === "login"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                mode === "register"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-lg"
                placeholder="Enter username"
                autoComplete="username"
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-lg"
                placeholder="Enter password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-danger font-bold bg-danger/10 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-3d w-full py-3 bg-accent text-white text-lg"
            >
              {loading
                ? "..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
