"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Layers,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  BarChart3,
  Loader2,
} from "lucide-react";

interface OverviewStats {
  totalUsers: number;
  totalTeams: number;
  totalQuizzes: number;
  activeQuiz: {
    id: string;
    title: string;
    status: string;
    isManualActive: boolean;
  } | null;
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load overview stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleActive = async (quizId: string, currentActive: boolean) => {
    setToggling(true);
    try {
      await fetch(`/api/admin/quizzes/${quizId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: currentActive ? "deactivate" : "activate",
        }),
      });
      await fetchStats();
    } catch (err) {
      console.error("Toggle active error", err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-cyan-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">
          Loading platform metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Administrator Console
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time management, assessment orchestration, and performance metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/quizzes/new"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-600/20 transition-all flex items-center space-x-1.5"
          >
            <span>+ Create Quiz</span>
          </Link>
        </div>
      </div>

      {/* Active Quiz Manager Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                stats?.activeQuiz
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Active Assessment Engine Status
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            Strict 1-Quiz Active Policy
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs text-slate-400 uppercase font-semibold">
              Current Active Quiz for Users
            </div>
            {stats?.activeQuiz ? (
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {stats.activeQuiz.title}
              </h2>
            ) : (
              <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400">
                No quiz is currently active. Users cannot start new assessments.
              </h2>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {stats?.activeQuiz ? (
              <>
                <button
                  onClick={() =>
                    handleToggleActive(stats.activeQuiz!.id, true)
                  }
                  disabled={toggling}
                  type="button"
                  className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5"
                >
                  <Pause className="w-4 h-4" />
                  <span>Deactivate Quiz</span>
                </button>
                <Link
                  href={`/admin/quizzes/${stats.activeQuiz.id}/preview`}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold transition-all"
                >
                  Preview
                </Link>
              </>
            ) : (
              <Link
                href="/admin/quizzes"
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Select & Activate a Quiz</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Students / Users
            </span>
            <Users className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-[11px] text-slate-400">
            Across {stats?.totalTeams || 0} configured teams
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Quizzes
            </span>
            <BookOpen className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats?.totalQuizzes || 0}
          </div>
          <div className="text-[11px] text-slate-400">Stored in database</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Completed Attempts
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats?.completedAttempts || 0}
          </div>
          <div className="text-[11px] text-slate-400">
            {stats?.inProgressAttempts || 0} in progress
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Average Score
            </span>
            <TrendingUp className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400">
            {stats?.avgScore || 0} pts
          </div>
          <div className="text-[11px] text-slate-400">
            High: {stats?.highestScore || 0} • Low: {stats?.lowestScore || 0}
          </div>
        </div>
      </div>

      {/* Quick Navigation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <Link
          href="/admin/quizzes"
          className="p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 shadow-md transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
              Quiz & Question Management
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create, edit, duplicate, schedule, and reorder sections or questions with code snippets and images.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Manage Quizzes</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          href="/admin/teams"
          className="p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 shadow-md transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
              Teams & User Accounts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Organize student participants into competing teams, create administrator accounts, and assign roles.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
            <span>Manage Teams & Users</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          href="/admin/leaderboard"
          className="p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 shadow-md transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">
              Analytics & Leaderboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              View per-question accuracy rates, team completion statistics, median scores, and real-time rankings.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
            <span>View Leaderboards</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}
