"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  User,
  Users,
  Calendar,
  LogOut,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ResultData {
  id: string;
  quizId: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  quiz: {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role?: "USER" | "ADMIN" | string | null;
    team: { id: string; name: string } | null;
  };
}

export default function QuizResultPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        setLoading(true);
        const res = await fetch(`/api/user/attempt/${attemptId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load submission receipt.");
        }

        setResult(data.attempt);
      } catch (err: any) {
        setError(err.message || "Could not retrieve assessment details.");
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Hard redirect so server-side session cookie is re-read fresh in production
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error", err);
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070d1e] text-cyan-400 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Loading submission status...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#070d1e] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Submission Status Unavailable
        </h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-semibold shadow-md"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Duration calculation
  let durationStr = "—";
  if (result.startedAt && result.submittedAt) {
    const start = new Date(result.startedAt).getTime();
    const end = new Date(result.submittedAt).getTime();
    const diffSecs = Math.max(0, Math.floor((end - start) / 1000));
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    durationStr = `${mins}m ${secs}s`;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar user={result.user} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-6">
        {/* Main Confirmation Hero Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-emerald-500/30 shadow-2xl relative overflow-hidden space-y-8 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Success Check Icon */}
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Submission Verified & Locked</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Assessment Submitted Successfully
            </h1>
            <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
              {result.quiz.title}
            </p>
          </div>

          {/* Receipt Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Participant</span>
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {result.user.name}
              </p>
              {result.user.team && (
                <p className="text-xs text-cyan-600 dark:text-cyan-400 flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{result.user.team.name}</span>
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time Recorded</span>
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {durationStr}
              </p>
              <p className="text-xs text-slate-500">
                {result.submittedAt ? formatDate(result.submittedAt) : "Just now"}
              </p>
            </div>
          </div>

          {/* Guidelines Notice */}
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-left space-y-1.5">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Assessment Summary Policy</span>
            </div>
            <p>
              Your responses have been securely stored in the system database. In accordance with examination regulations, individual question summaries, correct answers, and final scores are withheld.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Final cohort standings and results will be reviewed and published by administrators.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Home</span>
            </Link>

            <button
              onClick={handleLogout}
              type="button"
              className="px-6 py-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
