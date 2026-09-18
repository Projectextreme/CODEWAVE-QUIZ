"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Calendar, AlertCircle, Loader2, Key } from "lucide-react";

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passcode, setPasscode] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/quizzes/${quizId}`);
        const data = await res.json();
        if (res.ok && data.quiz) {
          setTitle(data.quiz.title);
          setDescription(data.quiz.description || "");
          setPasscode(data.quiz.passcode || "");
          setDurationMinutes(String(data.quiz.durationMinutes || 45));
          if (data.quiz.startTime) {
            setStartTime(new Date(data.quiz.startTime).toISOString().slice(0, 16));
          }
          if (data.quiz.endTime) {
            setEndTime(new Date(data.quiz.endTime).toISOString().slice(0, 16));
          }
          setStatus(data.quiz.status);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }

    if (quizId) loadQuiz();
  }, [quizId]);

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
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "PUT",
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
        throw new Error(data.error || "Failed to update quiz.");
      }

      router.push("/admin/quizzes");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-2 text-cyan-500">
        <Loader2 className="w-7 h-7 animate-spin" />
        <p className="text-xs text-slate-400">Loading quiz settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            <span>Edit Quiz Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Update timing parameters, passcode, description, and status.
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
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Scheduled Start Time</span>
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
                <span>Scheduled End Time</span>
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
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
