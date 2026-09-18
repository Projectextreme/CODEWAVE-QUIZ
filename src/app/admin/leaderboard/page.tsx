"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Medal, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";

interface QuizInfo {
  id: string;
  title: string;
  description: string;
  status: string;
  durationMinutes: number;
  maxScore: number;
}

interface TeamRanking {
  teamId: string;
  teamName: string;
  hasAttempted: boolean;
  status: "SUBMITTED" | "IN_PROGRESS" | "NOT_ATTEMPTED";
  participant: {
    id: string;
    name: string;
    email: string;
  } | null;
  totalScore: number;
  maxScore: number;
  percentage: number;
  durationSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
}

interface QuizOption {
  id: string;
  title: string;
}

function AdminLeaderboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramQuizId = searchParams.get("quizId") || "";

  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(paramQuizId);
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch list of quizzes for dropdown
  useEffect(() => {
    fetch("/api/admin/quizzes")
      .then((res) => (res.ok ? res.json() : { quizzes: [] }))
      .then((data) => {
        const list = data.quizzes || [];
        setQuizzes(list);
        if (!selectedQuizId && list.length > 0) {
          // Preselect active quiz or first quiz
          const active = list.find((q: any) => q.isManualActive || q.status === "ACTIVE");
          const targetId = active ? active.id : list[0].id;
          setSelectedQuizId(targetId);
        }
      })
      .catch(() => {});
  }, [selectedQuizId]);

  // Fetch Leaderboard for the selected quiz
  useEffect(() => {
    if (!selectedQuizId) return;

    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/leaderboard?quizId=${selectedQuizId}`);
        const data = await res.json();
        if (res.ok) {
          setQuizInfo(data.quiz);
          setRankings(data.rankings || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [selectedQuizId]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Quiz Standings & Leaderboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ranked team performance per assessment (1 user attempt per team).
          </p>
        </div>

        {/* Quiz Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Select Quiz:
          </span>
          <select
            value={selectedQuizId}
            onChange={(e) => {
              setSelectedQuizId(e.target.value);
              router.push(`/admin/leaderboard?quizId=${e.target.value}`);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-2 text-cyan-600">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-xs text-slate-400">Loading standings...</p>
        </div>
      ) : !quizInfo ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          No assessment selected.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quiz Summary Strip */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {quizInfo.title}
              </span>
              <span className="text-slate-400 ml-2">
                (Max: {quizInfo.maxScore} pts • Duration: {quizInfo.durationMinutes}m)
              </span>
            </div>
            <div className="text-slate-500">
              {rankings.filter((r) => r.status === "SUBMITTED").length} of{" "}
              {rankings.length} Teams Submitted
            </div>
          </div>

          {/* Standings Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="px-5 py-3 w-16">Rank</th>
                    <th className="px-5 py-3">Team</th>
                    <th className="px-5 py-3">Participant</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Percentage</th>
                    <th className="px-5 py-3">Time Taken</th>
                    <th className="px-5 py-3 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {rankings.map((team, idx) => {
                    const isTop1 = idx === 0 && team.status === "SUBMITTED";
                    const isTop2 = idx === 1 && team.status === "SUBMITTED";
                    const isTop3 = idx === 2 && team.status === "SUBMITTED";

                    return (
                      <tr
                        key={team.teamId}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                          isTop1 ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                        }`}
                      >
                        <td className="px-5 py-3.5 font-bold">
                          {team.status === "SUBMITTED" ? (
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                                isTop1
                                  ? "bg-amber-500 text-slate-950 font-black"
                                  : isTop2
                                  ? "bg-slate-300 text-slate-900"
                                  : isTop3
                                  ? "bg-amber-700 text-white"
                                  : "text-slate-400"
                              }`}
                            >
                              {idx + 1}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                          {team.teamName}
                        </td>

                        <td className="px-5 py-3.5">
                          {team.participant ? (
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {team.participant.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {team.participant.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              team.status === "SUBMITTED"
                                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                                : team.status === "IN_PROGRESS"
                                ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}
                          >
                            {team.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                          {team.status === "SUBMITTED"
                            ? `${team.totalScore} / ${team.maxScore}`
                            : "-"}
                        </td>

                        <td className="px-5 py-3.5 font-bold text-cyan-600 dark:text-cyan-400">
                          {team.status === "SUBMITTED" ? `${team.percentage}%` : "-"}
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                          {team.durationSeconds !== null
                            ? formatDuration(team.durationSeconds)
                            : "-"}
                        </td>

                        <td className="px-5 py-3.5 text-right text-xs text-slate-400">
                          {formatDate(team.submittedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-2 text-cyan-600">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-xs text-slate-400">Loading standings...</p>
        </div>
      }
    >
      <AdminLeaderboardContent />
    </Suspense>
  );
}
