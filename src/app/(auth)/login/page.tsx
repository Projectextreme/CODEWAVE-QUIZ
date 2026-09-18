"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import {
  Layers,
  KeyRound,
  User,
  Users,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

function LoginForm() {
  const [passcode, setPasscode] = useState("");
  const [participant1, setParticipant1] = useState("");
  const [participant2, setParticipant2] = useState("");
  const [teamName, setTeamName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleParticipantLogin = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/auth/passcode-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: passcode.trim(),
          name: combinedName,
          participant1: participant1.trim(),
          participant2: participant2.trim(),
          teamName: teamName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Passcode verification failed.");
      }

      // Store passcode in sessionStorage so dashboard & take page don't ask again
      if (typeof window !== "undefined") {
        if (data.quiz?.id) {
          sessionStorage.setItem(`semaphore_passcode_${data.quiz.id}`, passcode.trim());
        }
        sessionStorage.setItem("semaphore_last_passcode", passcode.trim());
      }

      // Hard redirect so the server-side session cookie is read fresh
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "An error occurred during participant login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-8">
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semaphore Assessment Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Join Assessment
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter the quiz passcode and your team details to start
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Participant Login Form */}
        <form onSubmit={handleParticipantLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Quiz Passcode *</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-normal lowercase">
                unique per quiz
              </span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="e.g. SEM2026"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm font-mono uppercase tracking-wider transition-all"
              />
            </div>
          </div>

          {/* Participant 1 Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Participant 1 Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={participant1}
                onChange={(e) => setParticipant1(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm transition-all"
              />
            </div>
          </div>

          {/* Participant 2 Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
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
                placeholder="e.g. Sam Taylor"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Team Name *
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Team Alpha"
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
                <span>Verifying & Entering...</span>
              </>
            ) : (
              <>
                <span>Enter Assessment Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 p-4 sm:p-6 transition-colors">
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
            Semaphore <span className="text-cyan-500 font-semibold text-xs ml-1">Assessment</span>
          </span>
        </div>
        <ThemeToggle />
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center my-12 text-cyan-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      {/* Page bottom */}
      <div className="text-center text-xs text-slate-400 py-4">
        Semaphore High-Throughput Assessment Engine
      </div>
    </div>
  );
}
