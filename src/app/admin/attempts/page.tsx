"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  Loader2,
  Award,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AttemptItem {
  id: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  teamName: string;
  startedAt: string;
  submittedAt: string | null;
  status: "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
}

function AdminAttemptsContent() {
  const searchParams = useSearchParams();
  const quizIdParam = searchParams.get("quizId") || "";

  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      let url = `/api/admin/attempts?`;
      if (quizIdParam) url += `quizId=${quizIdParam}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setAttempts(data.attempts);
      }
    } catch (err) {
      console.error("Fetch attempts error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [quizIdParam, statusFilter]);

  const filteredAttempts = attempts.filter((a) => {
    const matchesSearch =
      a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <Clock className="w-6 h-6 text-cyan-500" />
            <span>Live Assessment Attempt Monitor</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time tracking of in-progress sessions, completed submissions, and authoritative scoring logs.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, email, team, or quiz..."
            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            <option value="">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs text-slate-400">Loading attempts log...</p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          No matching assessment attempts found.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Assessment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Percentage</th>
                  <th className="px-6 py-4">Started</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                {filteredAttempts.map((att) => (
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

                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {att.quizTitle}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          att.status === "SUBMITTED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : att.status === "IN_PROGRESS"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {att.totalScore !== null
                        ? `${att.totalScore} / ${att.maxScore}`
                        : "-"}
                    </td>

                    <td className="px-6 py-4 font-black text-cyan-600 dark:text-cyan-400">
                      {att.percentage !== null ? `${att.percentage}%` : "-"}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(att.startedAt)}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(att.submittedAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {att.status === "SUBMITTED" ? (
                        <Link
                          href={`/quiz/${att.quizId}/result/${att.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all inline-block"
                        >
                          View Breakdown
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAttemptsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs text-slate-400">Loading attempts...</p>
        </div>
      }
    >
      <AdminAttemptsContent />
    </Suspense>
  );
}
