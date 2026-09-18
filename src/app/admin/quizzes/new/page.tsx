"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Calendar, AlertCircle, Key } from "lucide-react";

export default function NewQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passcode, setPasscode] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRandomPasscode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "SEM-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasscode(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          passcode: passcode.trim() || null,
          durationMinutes: Number(durationMinutes) || 30,
          startTime: startTime ? new Date(startTime).toISOString() : null,
          endTime: endTime ? new Date(endTime).toISOString() : null,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create quiz.");
      }

      router.push(`/admin/quizzes/${data.quiz.id}/sections`);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/admin/quizzes"
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-cyan-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-600" />
            <span>Create New Quiz</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure quiz details, passcode, and timing before adding questions.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Quiz Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full-Stack Web & Systems Assessment"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions or topics covered in this quiz..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Unique Quiz Passcode</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomPasscode}
                  className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  🎲 Generate Code
                </button>
              </div>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="e.g. SEM2026"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Participants will enter this unique passcode to log in and start this quiz.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>Duration (Minutes) *</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Time (Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>End Time (Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin/quizzes"
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Save & Add Questions →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
