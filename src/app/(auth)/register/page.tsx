"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, Lock, Mail, User, Users, ArrowRight, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface Team {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const [participant1, setParticipant1] = useState("");
  const [participant2, setParticipant2] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/teams")
      .then((res) => (res.ok ? res.json() : { teams: [] }))
      .then((data) => setTeams(data.teams || []))
      .catch(() => {});
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const names = [participant1.trim(), participant2.trim()].filter(Boolean);
    if (names.length === 0) {
      setError("Please enter at least one participant name.");
      return;
    }

    const combinedName = names.join(", ");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: combinedName,
          email,
          password,
          teamId: teamId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Hard redirect so the server-side session cookie is read fresh
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 p-4 sm:p-6 transition-colors">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
            Semaphore
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Create Student Account
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Join your team to participate in live active assessments
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Participant 1 Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={participant1}
                  onChange={(e) => setParticipant1(e.target.value)}
                  placeholder="Alex Chen"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Participant 2 Name</span>
                <span className="text-[10px] text-slate-400 font-normal lowercase">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={participant2}
                  onChange={(e) => setParticipant2(e.target.value)}
                  placeholder="Sam Taylor"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@semaphore.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Assigned Team (Optional)
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm transition-all"
                >
                  <option value="">No Team Assigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-600/25 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="animate-pulse">Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 py-4">
        Semaphore High-Throughput Assessment Engine
      </div>
    </div>
  );
}
