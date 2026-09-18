"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Users,
  Loader2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";

interface QuizOption {
  id: string;
  title: string;
}

interface AnalyticsData {
  quiz: {
    id: string;
    title: string;
    description: string;
    status: string;
    durationMinutes: number;
    totalQuestions: number;
    maxMarks: number;
  };
  metrics: {
    totalParticipants: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    avgScore: number;
    medianScore: number;
    highestScore: number;
    lowestScore: number;
    avgCompletionTimeSecs: number;
  };
  distribution: Array<{
    range: string;
    count: number;
  }>;
  questionMetrics: Array<{
    id: string;
    text: string;
    type: string;
    marks: number;
    totalAttempts: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    correctPct: number;
    incorrectPct: number;
    skippedPct: number;
    avgMarks: number;
  }>;
  recentAttempts: Array<{
    id: string;
    userName: string;
    userEmail: string;
    teamName: string;
    status: string;
    totalScore: number | null;
    maxScore: number | null;
    percentage: number | null;
    startedAt: string;
    submittedAt: string | null;
  }>;
}

function AdminAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialQuizId = searchParams.get("quizId");

  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(initialQuizId || "");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load Quizzes list
  useEffect(() => {
    fetch("/api/admin/quizzes")
      .then((res) => (res.ok ? res.json() : { quizzes: [] }))
      .then((data) => {
        const list = data.quizzes || [];
        setQuizzes(list);
        if (!selectedQuizId && list.length > 0) {
          setSelectedQuizId(list[0].id);
        }
      })
      .catch(() => {});
  }, [selectedQuizId]);

  // Load Analytics for selected Quiz
  useEffect(() => {
    if (!selectedQuizId) return;

    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/analytics/${selectedQuizId}`);
        const data = await res.json();
        if (res.ok) {
          setAnalytics(data.analytics);
        }
      } catch (err) {
        console.error("Analytics fetch error", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [selectedQuizId]);

  return (
    <div className="space-y-8">
      {/* Header & Quiz Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <BarChart3 className="w-6 h-6 text-cyan-500" />
            <span>Assessment Analytics & Diagnostics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Granular insights across participant scores, question accuracy rates, and completion times.
          </p>
        </div>

        {/* Quiz selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">Quiz:</span>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs text-slate-400">Aggregating real-time score statistics...</p>
        </div>
      ) : !analytics ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No analytics available for this quiz.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Participants
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics.metrics.totalParticipants}
              </div>
              <div className="text-[10px] text-slate-400">
                {analytics.metrics.completed} Completed
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Avg Score
              </div>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                {analytics.metrics.avgScore} pts
              </div>
              <div className="text-[10px] text-slate-400">
                Out of {analytics.quiz.maxMarks} max
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Median Score
              </div>
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {analytics.metrics.medianScore} pts
              </div>
              <div className="text-[10px] text-slate-400">50th Percentile</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Highest Score
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {analytics.metrics.highestScore} pts
              </div>
              <div className="text-[10px] text-slate-400">Top score achieved</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Lowest Score
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {analytics.metrics.lowestScore} pts
              </div>
              <div className="text-[10px] text-slate-400">Baseline score</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Avg Duration
              </div>
              <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {analytics.metrics.avgCompletionTimeSecs > 0
                  ? formatDuration(analytics.metrics.avgCompletionTimeSecs)
                  : "-"}
              </div>
              <div className="text-[10px] text-slate-400">Completion time</div>
            </div>
          </div>

          {/* Score Distribution Chart */}
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
              <span>Score Distribution Across Percentile Brackets</span>
            </h3>

            <div className="grid grid-cols-5 gap-3 pt-4">
              {analytics.distribution.map((bucket) => {
                const maxCount = Math.max(
                  ...analytics.distribution.map((d) => d.count),
                  1
                );
                const heightPct = Math.round((bucket.count / maxCount) * 100);

                return (
                  <div
                    key={bucket.range}
                    className="flex flex-col items-center space-y-2"
                  >
                    <div className="w-full h-32 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-end p-1 relative overflow-hidden">
                      <div
                        style={{ height: `${Math.max(heightPct, 8)}%` }}
                        className="w-full bg-gradient-to-t from-cyan-600 to-sky-400 rounded-lg transition-all duration-500 flex items-center justify-center text-white text-xs font-bold shadow-md"
                      >
                        {bucket.count > 0 && bucket.count}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {bucket.range}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Level Metrics Table */}
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-2">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>Question Accuracy & Difficulty Diagnostics</span>
              </h3>
              <span className="text-xs text-slate-400">
                {analytics.questionMetrics.length} Questions Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Question Prompt</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Correct %</th>
                    <th className="px-6 py-4">Incorrect %</th>
                    <th className="px-6 py-4">Skipped %</th>
                    <th className="px-6 py-4">Avg Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                  {analytics.questionMetrics.map((qm, idx) => (
                    <tr
                      key={qm.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="px-6 py-4 max-w-xs md:max-w-md">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                          {qm.text}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                          {qm.type}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {qm.correctPct}%
                      </td>

                      <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">
                        {qm.incorrectPct}%
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {qm.skippedPct}%
                      </td>

                      <td className="px-6 py-4 font-bold text-cyan-600 dark:text-cyan-400">
                        {qm.avgMarks} / {qm.marks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Attempts Table */}
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-2">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-500" />
                <span>Participant Attempts & Score Log</span>
              </h3>
              <span className="text-xs text-slate-400">
                {analytics.recentAttempts.length} Total Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Percentage</th>
                    <th className="px-6 py-4">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                  {analytics.recentAttempts.map((att) => (
                    <tr
                      key={att.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {att.userName}
                        </div>
                        <div className="text-xs text-slate-400">{att.userEmail}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold">
                          {att.teamName}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            att.status === "SUBMITTED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {att.totalScore !== null ? `${att.totalScore} / ${att.maxScore}` : "-"}
                      </td>

                      <td className="px-6 py-4 font-bold text-cyan-600 dark:text-cyan-400">
                        {att.percentage !== null ? `${att.percentage}%` : "-"}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {formatDate(att.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs text-slate-400">Loading analytics dashboard...</p>
        </div>
      }
    >
      <AdminAnalyticsContent />
    </Suspense>
  );
}
