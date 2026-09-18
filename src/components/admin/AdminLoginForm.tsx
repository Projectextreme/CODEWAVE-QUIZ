"use client";

import React, { useState } from "react";

import {
  Layers,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Admin authentication failed.");
      }

      if (data.user.role !== "ADMIN") {
        throw new Error("Access restricted. Administrator privileges required.");
      }

      // Hard redirect so the server-side session cookie is read fresh
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "An error occurred during admin login.");
    } finally {
      setLoading(false);
    }
  };

  const fillAdminDemo = () => {
    setEmail("admin@semaphore.com");
    setPassword("admin123");
    setError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Admin Authentication
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authorized administrator credentials required
          </p>
        </div>

        {/* 1-Click Demo Fill */}
        <div className="p-3 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Demo Credentials
          </span>
          <button
            type="button"
            onClick={fillAdminDemo}
            className="px-2.5 py-1 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/30 transition-colors"
          >
            1-Click Fill
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@semaphore.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-600/25 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
